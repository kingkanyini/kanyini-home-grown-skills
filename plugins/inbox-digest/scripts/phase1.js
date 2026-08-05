// Phase 1 — Discover.
// Resolve the client hub, validate, compute scan window, build Gmail query.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import matter from "gray-matter";
import { CLIENTS_DIR, VAULT_ROOT, toGmailDate, log } from "./util.js";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
const LABEL_RE = /^Clients\/[A-Za-z0-9][A-Za-z0-9_-]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Global reply-SLA default (business-hours). Per-client `reply_sla` frontmatter overrides.
const DEFAULT_REPLY_SLA = { heads_up_hours: 24, reply_due_hours: 48, followup_hours: 96 };

const ACCOUNTS_FILE = path.join(os.homedir(), ".claude", "contacts", "accounts.json");
let _defaultMeAddresses = null;

/**
 * The default "me" identity set — every address <your-name> sends from, read once from
 * ~/.claude/contacts/accounts.json. A reply whose sender is in this set means "<your-name>
 * replied"; `from:me` alone only covers the single authed account (ARCH-F1).
 */
export async function loadDefaultMeAddresses() {
  if (_defaultMeAddresses) return _defaultMeAddresses;
  try {
    const raw = await fs.readFile(ACCOUNTS_FILE, "utf8");
    const data = JSON.parse(raw);
    _defaultMeAddresses = (data.accounts || [])
      .map((a) => (a.email || "").toLowerCase())
      .filter((e) => EMAIL_RE.test(e));
  } catch {
    _defaultMeAddresses = [];
  }
  return _defaultMeAddresses;
}

/**
 * Validate + normalize a client's reply_sla frontmatter. Reject-and-name on violation
 * (same convention as slug/label). Returns the validated object (or the default if absent).
 */
export function validateReplySla(raw, slug) {
  if (raw == null) return { ...DEFAULT_REPLY_SLA };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`reply_sla for '${slug}' must be a mapping of *_hours values`);
  }
  const out = { ...DEFAULT_REPLY_SLA, ...raw };
  for (const key of ["heads_up_hours", "reply_due_hours", "followup_hours"]) {
    const v = out[key];
    if (key === "heads_up_hours" && (v == null)) continue; // soft tier optional
    if (!Number.isInteger(v) || v <= 0 || v > 8760) {
      throw new Error(`reply_sla.${key} for '${slug}' must be an integer in (0, 8760]; got ${JSON.stringify(v)}`);
    }
  }
  const hu = out.heads_up_hours == null ? out.reply_due_hours : out.heads_up_hours;
  if (!(hu <= out.reply_due_hours && out.reply_due_hours <= out.followup_hours)) {
    throw new Error(
      `reply_sla for '${slug}' must be monotonic: heads_up(${out.heads_up_hours}) <= reply_due(${out.reply_due_hours}) <= followup(${out.followup_hours})`,
    );
  }
  return out;
}

/**
 * Validate the reply-drafter frontmatter config. Drafting is opt-in per client
 * (draft_replies: true) — only tws-newsletter sets it today.
 */
export function validateDraftConfig(fm, slug) {
  const out = {
    draft_replies: fm.draft_replies === true,
    draft_ceiling: 10,
    draft_deny_senders: [],
    draft_require_to_name: null,
  };
  if (fm.draft_require_to_name != null) {
    // String or list of strings — the gate accepts a To display name matching ANY entry.
    const raw = Array.isArray(fm.draft_require_to_name) ? fm.draft_require_to_name : [fm.draft_require_to_name];
    if (raw.length === 0) {
      throw new Error(`draft_require_to_name for '${slug}' must be a non-empty string or list of strings`);
    }
    for (const n of raw) {
      if (typeof n !== "string" || !n.trim() || n.length > 100) {
        throw new Error(`draft_require_to_name entry '${n}' for '${slug}' must be a non-empty string (max 100 chars)`);
      }
    }
    out.draft_require_to_name = raw.map((n) => n.trim());
  }
  if (fm.draft_ceiling != null) {
    if (!Number.isInteger(fm.draft_ceiling) || fm.draft_ceiling < 1 || fm.draft_ceiling > 100) {
      throw new Error(`draft_ceiling for '${slug}' must be an integer in [1, 100]`);
    }
    out.draft_ceiling = fm.draft_ceiling;
  }
  if (fm.draft_deny_senders != null) {
    if (!Array.isArray(fm.draft_deny_senders)) {
      throw new Error(`draft_deny_senders for '${slug}' must be a list`);
    }
    for (const s of fm.draft_deny_senders) {
      if (typeof s !== "string" || !EMAIL_RE.test(s.toLowerCase())) {
        throw new Error(`draft_deny_senders entry '${s}' for '${slug}' is not a valid email`);
      }
    }
    out.draft_deny_senders = fm.draft_deny_senders.map((s) => s.toLowerCase());
  }
  return out;
}

// Slack channel IDs: C/G/D prefix + 8+ alphanumerics. User IDs: U/W prefix.
const SLACK_CHANNEL_ID_RE = /^[CGD][A-Z0-9]{7,}$/;
const SLACK_USER_ID_RE = /^[UW][A-Z0-9]{7,}$/;
const LANE_VALUES = ["finance", "people", "ai", "funnel", "cx"];

/**
 * Validate + normalize the hub's `slack:` frontmatter block (Sentinel spec §3 step 1).
 * Absent block = Slack lane OFF for this client (all other clients untouched).
 * Config is human-owned and lives here; runtime state lives in slack-state.json.
 *
 * Shape:
 *   slack:
 *     user_id: U…                 # <your-name>'s Slack member ID (Phase 2c author filter,
 *                                 # inferred-done, "me" classification)
 *     command_center: C…          # digest channel (Phase 2c reads; capture-denied)
 *     movement_threshold: 3       # conditional-post gate (spec §4)
 *     thread_window_days: 14      # active-thread back-scan window (spec §3)
 *     replies_call_cap: 20        # per-sweep replies fan-out cap (spec §5)
 *     roster:                     # optional raw-ID → display-name map (render time only,
 *       U123ABC: <example-client>             # keeps least-privilege: no users:read scope)
 *     channels:                   # capture allowlist, pinned to channel IDs
 *       - id: C…
 *         name: team-ops          # display only — never used for matching
 *         lane: null              # optional deterministic lane (lane_source: channel)
 *         mirror: true            # false for #<your-username>-<example-client> (never client-facing)
 */
export function validateSlackConfig(raw, slug) {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`slack block for '${slug}' must be a mapping`);
  }
  if (!SLACK_USER_ID_RE.test(String(raw.user_id || ""))) {
    throw new Error(`slack.user_id for '${slug}' must be a Slack member ID (U…); got ${JSON.stringify(raw.user_id)}`);
  }
  if (!SLACK_CHANNEL_ID_RE.test(String(raw.command_center || ""))) {
    throw new Error(`slack.command_center for '${slug}' must be a Slack channel ID (C…)`);
  }
  if (!Array.isArray(raw.channels) || raw.channels.length === 0) {
    throw new Error(`slack.channels for '${slug}' must be a non-empty list of {id, name, lane?, mirror?}`);
  }
  const channels = raw.channels.map((ch) => {
    if (!ch || !SLACK_CHANNEL_ID_RE.test(String(ch.id || ""))) {
      throw new Error(`slack.channels entry for '${slug}' has invalid id ${JSON.stringify(ch && ch.id)} — allowlist is pinned to channel IDs, never names`);
    }
    if (ch.lane != null && !LANE_VALUES.includes(ch.lane)) {
      throw new Error(`slack.channels['${ch.id}'].lane for '${slug}' must be one of ${LANE_VALUES.join("/")}`);
    }
    return {
      id: ch.id,
      name: String(ch.name || ch.id),
      lane: ch.lane || null,
      mirror: ch.mirror !== false,
    };
  });
  if (channels.some((ch) => ch.id === raw.command_center)) {
    throw new Error(`slack.channels for '${slug}' must NOT include command_center (${raw.command_center}) — it is capture-denied by design (spec §5)`);
  }
  const ids = channels.map((c) => c.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`slack.channels for '${slug}' contains duplicate channel IDs`);
  }
  const intOr = (v, dflt, name, max) => {
    if (v == null) return dflt;
    if (!Number.isInteger(v) || v < 1 || v > max) {
      throw new Error(`slack.${name} for '${slug}' must be an integer in [1, ${max}]`);
    }
    return v;
  };
  // Optional ❤️-save target: vault-relative dir where hearted digest items get
  // promoted (the projects umbrella). Validated against traversal; created on use.
  let savedDir = null;
  if (raw.saved_dir != null) {
    if (typeof raw.saved_dir !== "string" || raw.saved_dir.includes("..") || path.isAbsolute(raw.saved_dir)) {
      throw new Error(`slack.saved_dir for '${slug}' must be a vault-relative path with no '..'`);
    }
    savedDir = raw.saved_dir.replace(/\\/g, "/").replace(/\/+$/, "");
  }
  const roster = {};
  if (raw.roster != null) {
    if (typeof raw.roster !== "object" || Array.isArray(raw.roster)) {
      throw new Error(`slack.roster for '${slug}' must be a mapping of Slack user ID → display name`);
    }
    for (const [uid, name] of Object.entries(raw.roster)) {
      if (!SLACK_USER_ID_RE.test(uid) || typeof name !== "string" || !name.trim()) {
        throw new Error(`slack.roster entry '${uid}' for '${slug}' is invalid`);
      }
      roster[uid] = name.trim();
    }
  }
  // Team weekly digests (team-support spec §2.1). Identity pair must match roster;
  // mode fail-safe: anything ≠ "live" behaves as shadow.
  const digests = [];
  if (raw.digests != null) {
    if (!Array.isArray(raw.digests)) throw new Error(`slack.digests for '${slug}' must be a list`);
    for (const d of raw.digests) {
      if (!d || !SLACK_USER_ID_RE.test(String(d.user_id || ""))) {
        throw new Error(`slack.digests entry for '${slug}' has invalid user_id`);
      }
      if (d.cadence !== "weekly") throw new Error(`slack.digests['${d.user_id}'].cadence must be "weekly"`);
      if (!["paced", "operator"].includes(d.style)) throw new Error(`slack.digests['${d.user_id}'].style must be paced|operator`);
      if (roster[d.user_id] !== d.name) {
        console.log(`WARN slack.digests: identity pair mismatch for ${d.user_id} ("${d.name}" vs roster "${roster[d.user_id] || "(absent)"}") — recipient DROPPED`);
        continue; // skip + alert (spec §2.1) — never guess an identity
      }
      const mode = d.mode === "live" ? "live" : "shadow";
      if (d.mode != null && d.mode !== "live" && d.mode !== "shadow") {
        console.log(`WARN slack.digests: unrecognized mode "${d.mode}" for ${d.user_id} — treated as shadow`);
      } // absent mode = the documented default (shadow), no warning
      digests.push({ user_id: d.user_id, name: d.name, cadence: "weekly", style: d.style, mode });
    }
  }

  return {
    user_id: raw.user_id,
    command_center: raw.command_center,
    channels,
    roster,
    saved_dir: savedDir,
    digests,
    movement_threshold: intOr(raw.movement_threshold, 3, "movement_threshold", 100),
    thread_window_days: intOr(raw.thread_window_days, 14, "thread_window_days", 365),
    replies_call_cap: intOr(raw.replies_call_cap, 20, "replies_call_cap", 200),
  };
}

/**
 * Resolve a client hub by slug. Returns { hub_path, hub_layout, client_dir, frontmatter }
 * or throws an Error with a user-facing message.
 */
export async function resolveClientHub(slug) {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`slug '${slug}' fails validation regex ${SLUG_RE.source}`);
  }
  // Path containment check (CIPHER-F2)
  const clientDir = path.resolve(path.join(CLIENTS_DIR, slug));
  const baseResolved = path.resolve(CLIENTS_DIR);
  if (!clientDir.startsWith(baseResolved + path.sep) && clientDir !== baseResolved) {
    throw new Error(`slug '${slug}' resolves outside vault clients dir`);
  }

  // Try in order: folder layout → flat (no suffix, new canonical) → flat (-client suffix, legacy).
  // The 2026-05-13 "drop -client suffix" rename made `<slug>.md` the new canonical for flat hubs;
  // -client.md is kept as backward-compat for any hubs not yet migrated.
  const folderHub = path.join(clientDir, "index.md");
  const flatHub = path.join(CLIENTS_DIR, `${slug}.md`);
  const legacyClientHub = path.join(CLIENTS_DIR, `${slug}-client.md`);

  let hubPath = null;
  let layout = null;
  for (const [candidate, name] of [
    [folderHub, "folder"],
    [flatHub, "flat"],
    [legacyClientHub, "flat-client-legacy"],
  ]) {
    try {
      await fs.stat(candidate);
      hubPath = candidate;
      layout = name;
      break;
    } catch {
      // try next
    }
  }

  if (!hubPath) {
    throw new Error(
      `Client '${slug}' has no hub note (looked for ${slug}/index.md, ${slug}.md, and ${slug}-client.md)`,
    );
  }

  const raw = await fs.readFile(hubPath, "utf8");
  const { data: fm } = matter(raw);

  // 1.2.d required-fields check
  for (const required of ["client", "slug", "gmail_accounts"]) {
    if (!fm[required] || (Array.isArray(fm[required]) && fm[required].length === 0)) {
      throw new Error(`Frontmatter missing required field '${required}'`);
    }
  }
  const matchSources = [fm.email_addresses, fm.domains, fm.aliases].filter(
    (a) => Array.isArray(a) && a.length > 0,
  );
  if (matchSources.length === 0) {
    throw new Error("Frontmatter must have at least one of email_addresses/domains/aliases populated");
  }

  // 1.2.e gmail_label allowlist
  if (fm.gmail_label && !LABEL_RE.test(fm.gmail_label)) {
    throw new Error(
      `gmail_label '${fm.gmail_label}' must match Clients/* prefix (allowlist)`,
    );
  } else if (!fm.gmail_label) {
    await log("warn", `phase1 client=${slug} no gmail_label set; threads will not be auto-labeled`);
  }

  // me_addresses (ARCH-F1): validate any declared addresses; union with the
  // accounts.json default so a reply from ANY of <your-name>'s addresses flips status.
  const declaredMe = Array.isArray(fm.me_addresses) ? fm.me_addresses : [];
  for (const addr of declaredMe) {
    if (typeof addr !== "string" || !EMAIL_RE.test(addr.toLowerCase())) {
      throw new Error(`me_addresses entry '${addr}' for '${slug}' is not a valid email`);
    }
  }
  const defaults = await loadDefaultMeAddresses();
  const meAddresses = Array.from(
    new Set([...defaults, ...declaredMe.map((a) => a.toLowerCase())]),
  );
  if (meAddresses.length === 0) {
    await log("warn", `phase1 client=${slug} no me_addresses resolved (accounts.json empty + none declared); reply-status will mark all latest senders 'unknown'`);
  }

  // reply_sla (reject-and-name on bad values) + business-day timezone anchor.
  const replySla = validateReplySla(fm.reply_sla, slug);
  const timezone =
    fm.timezone ||
    process.env.INBOX_DIGEST_TZ ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  return {
    hub_path: hubPath,
    hub_layout: layout,
    client_dir: clientDir,
    frontmatter: fm,
    me_addresses: meAddresses,
    reply_sla: replySla,
    timezone,
  };
}

/**
 * Compute the scan window. Returns {window_start: Date, window_end: Date}.
 */
export function computeWindow(frontmatter, sinceArg, now = new Date()) {
  let windowStart;
  if (sinceArg) {
    windowStart = new Date(sinceArg);
    if (isNaN(windowStart.getTime())) {
      throw new Error(`--since '${sinceArg}' is not a valid ISO date`);
    }
  } else if (frontmatter.last_scan) {
    windowStart = new Date(frontmatter.last_scan);
    if (isNaN(windowStart.getTime())) {
      throw new Error(`frontmatter last_scan '${frontmatter.last_scan}' is not a valid ISO date`);
    }
  } else {
    // First-run default: 30 days back
    windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return { window_start: windowStart, window_end: now };
}

/**
 * Build the Gmail OR-joined query.
 * Returns a query string ready to pass to Gmail's users.messages.list `q` param.
 */
export function buildQuery(frontmatter, windowStart) {
  const emails = (frontmatter.email_addresses || []).filter(Boolean);
  const domains = (frontmatter.domains || []).filter(Boolean);
  const aliases = (frontmatter.aliases || []).filter(Boolean);
  const relays = (frontmatter.relay_senders || []).filter(Boolean);

  const fromTerms = [];
  for (const e of emails) fromTerms.push(e);
  for (const d of domains) fromTerms.push(`@${d}`);

  const branches = [];
  if (fromTerms.length > 0) {
    branches.push(`from:(${fromTerms.join(" OR ")})`);
  }

  // Outbox branch: surface threads <your-name> SENT into (his replies merge in, and
  // the thread becomes visible even when only he wrote last). Same emails/domains
  // as the `from:` branch, on the `to:` operator. CIPHER-F12 gating in phase2
  // prevents a spoofed To:/Cc: from auto-filing a non-participant thread.
  if (fromTerms.length > 0) {
    branches.push(`to:(${fromTerms.join(" OR ")})`);
  }

  if (relays.length > 0 && aliases.length > 0) {
    const relayFrom = relays.join(" OR ");
    const aliasOr = aliases
      .map((a) => {
        if (a.includes(" ")) return `subject:"${a}" OR "${a}"`;
        return `subject:${a} OR ${a}`;
      })
      .join(" OR ");
    branches.push(`( from:(${relayFrom}) AND ( ${aliasOr} ) )`);
  }

  if (aliases.length > 0) {
    const aliasOr = aliases
      .map((a) => {
        if (a.includes(" ")) return `subject:"${a}" OR "${a}"`;
        return `subject:${a} OR ${a}`;
      })
      .join(" OR ");
    branches.push(`( from:me AND ( ${aliasOr} ) )`);
  }

  if (branches.length === 0) {
    throw new Error("No match channels configured in frontmatter — query would be empty");
  }

  const query = `( ${branches.join(" OR ")} ) after:${toGmailDate(windowStart)}`;
  return query;
}

/**
 * Verify the resolved match strategy + log a work tuple summary.
 */
export async function summarizePhase1(workTuple) {
  await log(
    "info",
    `phase1 client=${workTuple.client_slug} layout=${workTuple.hub_layout} window_start=${workTuple.window_start_iso} window_end=${workTuple.window_end_iso}`,
  );
  return workTuple;
}

/**
 * Top-level Phase 1 entry: returns a work tuple ready for Phase 2.
 */
export async function runPhase1({ clientSlug, sinceIso, now }) {
  const nowDate = now ? new Date(now) : new Date();
  const hub = await resolveClientHub(clientSlug);
  const fm = hub.frontmatter;
  const { window_start, window_end } = computeWindow(fm, sinceIso, nowDate);
  const query = buildQuery(fm, window_start);

  const workTuple = {
    client_slug: clientSlug,
    client_display: fm.client || clientSlug,
    hub_path: hub.hub_path,
    hub_layout: hub.hub_layout,
    client_dir: hub.client_dir,
    query_string: query,
    window_start_iso: window_start.toISOString(),
    window_end_iso: window_end.toISOString(),
    priority: fm.priority || "medium",
    match_strategy: fm.match_strategy || "any",
    gmail_label: fm.gmail_label || null,
    expected_account: (fm.gmail_accounts || [])[0],
    // Multi-account routing: the account this client scans (= credential dir key).
    account: ((fm.gmail_accounts || [])[0] || "").toLowerCase(),
    // Reply-drafter config (opt-in)
    ...validateDraftConfig(fm, clientSlug),
    backfill_confirm_threshold: fm.backfill_confirm_threshold || 100,
    // reply-status feature: identity set, SLA thresholds, business-day tz
    me_addresses: hub.me_addresses,
    reply_sla: hub.reply_sla,
    timezone: hub.timezone,
    // client match channels (for last_from "them" classification + CIPHER-F12 gate)
    client_emails: (fm.email_addresses || []).map((e) => String(e).toLowerCase()),
    client_domains: (fm.domains || []).map((d) => String(d).toLowerCase().replace(/^@/, "")),
    // hard-tier clients (no soft heads-up; 🔴 protected from cap eviction)
    reply_hard_tier: hub.reply_sla.heads_up_hours == null,
    // Phase 2 AI out-of-thread reply match — opt-in per client, default OFF.
    ai_reply_match: fm.ai_reply_match === true,
    // Sentinel Slack lane (spec §3) — null = lane off, this client is Gmail-only.
    slack: validateSlackConfig(fm.slack, clientSlug),
    vault_root: VAULT_ROOT,
  };

  await summarizePhase1(workTuple);
  return workTuple;
}
