// Phase 1 — Discover.
// Resolve the client hub, validate, compute scan window, build Gmail query.

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { CLIENTS_DIR, VAULT_ROOT, toGmailDate, log } from "./util.js";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
const LABEL_RE = /^Clients\/[A-Za-z0-9][A-Za-z0-9_-]*$/;

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

  return {
    hub_path: hubPath,
    hub_layout: layout,
    client_dir: clientDir,
    frontmatter: fm,
  };
}

/**
 * Compute the scan window. Returns {window_start: Date, window_end: Date}.
 */
export function computeWindow(frontmatter, sinceArg) {
  const now = new Date();
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
export async function runPhase1({ clientSlug, sinceIso }) {
  const hub = await resolveClientHub(clientSlug);
  const fm = hub.frontmatter;
  const { window_start, window_end } = computeWindow(fm, sinceIso);
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
    backfill_confirm_threshold: fm.backfill_confirm_threshold || 100,
    vault_root: VAULT_ROOT,
  };

  await summarizePhase1(workTuple);
  return workTuple;
}
