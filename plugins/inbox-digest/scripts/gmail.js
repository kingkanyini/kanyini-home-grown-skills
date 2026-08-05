// Gmail API wrapper. Reuses the gongrzhe OAuth credentials at ~/.gmail-mcp/.
// All MIME / part walking happens here so phase2 deals in clean message objects.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { google } from "googleapis";
import { parseAddress, parseAddresses, rfc2822ToIso } from "./util.js";

const execFileP = promisify(execFile);

export const DEFAULT_ACCOUNT = "<your-email>";

const ACCOUNT_DIRS = {
  "<your-email>": path.join(os.homedir(), ".gmail-mcp"),
  "<your-org-email>": path.join(os.homedir(), ".gmail-mcp-tws"),
};

/** Resolve the credential directory for an account. Throws on unknown accounts. */
export function resolveCredsDir(account = DEFAULT_ACCOUNT) {
  const key = String(account).toLowerCase().trim();
  const dir = ACCOUNT_DIRS[key];
  if (!dir) throw new Error(`No credential dir registered for account '${key}' (raw: '${account}')`);
  return dir;
}

// Per-account client cache. Keys are lowercase account emails.
const _clients = new Map();

/**
 * Build an authenticated Gmail v1 client for the given account.
 * googleapis refreshes the access token in-memory per run from the on-disk
 * refresh_token. Refreshed tokens are INTENTIONALLY NOT persisted — exactly one
 * writer per credential dir (gongrzhe/auth-tws at install time only), zero race
 * conditions between cron runs and interactive sessions.
 *
 * INTENTIONALLY do NOT persist refreshed tokens.
 * gongrzhe's Gmail-MCP-Server (the other consumer of this credentials file)
 * is read-only after the initial OAuth callback — verified by source review
 * of https://github.com/GongRzhe/Gmail-MCP-Server. By also not writing here,
 * we guarantee exactly one writer (gongrzhe at install time only) and zero
 * race conditions between concurrent cron runs and interactive Claude Code
 * sessions. googleapis still refreshes the access_token in-memory per run
 * using the stable refresh_token from disk; the new access_token vaporizes
 * when the script exits, which is correct.
 */
export async function getGmailClient(account = DEFAULT_ACCOUNT) {
  const key = String(account).toLowerCase().trim();
  // No in-flight Promise guard: a concurrent miss builds two clients; last-write-wins is benign
  // (both are read-only; credential files are never written here). See one-writer invariant above.
  if (_clients.has(key)) return _clients.get(key).gmail;

  const dir = resolveCredsDir(key);
  const [keyRaw, credRaw] = await Promise.all([
    fs.readFile(path.join(dir, "gcp-oauth.keys.json"), "utf8"),
    fs.readFile(path.join(dir, "credentials.json"), "utf8"),
  ]);
  const keys = JSON.parse(keyRaw);
  const installed = keys.installed || keys.web || keys;
  const tokens = JSON.parse(credRaw);

  const oauth2 = new google.auth.OAuth2(
    installed.client_id,
    installed.client_secret,
    installed.redirect_uris[0],
  );
  oauth2.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  _clients.set(key, { gmail, oauth2, tokens });
  return gmail;
}

/**
 * Probe authentication. Returns the email address of the authed account.
 */
export async function getAuthedEmail(account = DEFAULT_ACCOUNT) {
  const gmail = await getGmailClient(account);
  const res = await gmail.users.getProfile({ userId: "me" });
  return (res.data.emailAddress || "").toLowerCase();
}

/**
 * List messages matching a Gmail query. Handles pagination internally.
 * Returns an array of {id, threadId} pairs (gmail's stub shape).
 */
export async function listMessages(query, options = {}, account = DEFAULT_ACCOUNT) {
  const gmail = await getGmailClient(account);
  const maxTotal = options.maxTotal || 500;
  let collected = [];
  let pageToken;
  do {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: Math.min(500, maxTotal - collected.length),
      pageToken,
    });
    if (res.data.messages) collected = collected.concat(res.data.messages);
    pageToken = res.data.nextPageToken;
    if (collected.length >= maxTotal) break;
  } while (pageToken);
  return { messages: collected, capped: collected.length >= maxTotal };
}

/**
 * Fetch one message in `full` format (headers + payload tree).
 * Returns a normalized object: {id, threadId, headers, bodyPlain, bodyHtml, attachments, internalDate}.
 */
export async function getMessage(messageId, account = DEFAULT_ACCOUNT) {
  const gmail = await getGmailClient(account);
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  return normalizeMessage(res.data);
}

/**
 * Download an attachment by message + attachment ID. Writes to `outPath`.
 * Returns {bytes, path}.
 */
export async function downloadAttachment(messageId, attachmentId, outPath, account = DEFAULT_ACCOUNT) {
  const gmail = await getGmailClient(account);
  const res = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId,
    id: attachmentId,
  });
  const b64 = res.data.data || "";
  // Gmail returns URL-safe base64; convert + decode.
  const standard = b64.replace(/-/g, "+").replace(/_/g, "/");
  const buf = Buffer.from(standard, "base64");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, buf);
  return { bytes: buf.length, path: outPath };
}

// ----- Helpers (MIME / payload walking) ----------------------------------

function getHeader(headers, name) {
  if (!Array.isArray(headers)) return null;
  const h = headers.find(
    (x) => x.name && x.name.toLowerCase() === name.toLowerCase(),
  );
  return h ? h.value : null;
}

function decodePart(data) {
  if (!data) return "";
  const standard = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(standard, "base64").toString("utf8");
}

/**
 * Walk a payload tree and collect: plain body, html body, and attachment metadata.
 */
function walkPayload(payload, collector) {
  if (!payload) return;
  const mime = payload.mimeType || "";
  const filename = payload.filename || "";
  const body = payload.body || {};

  // Attachment: any part with a filename + attachmentId
  if (filename && body.attachmentId) {
    collector.attachments.push({
      id: body.attachmentId,
      filename,
      mime_type: mime,
      size_bytes: body.size || 0,
    });
  } else if (mime === "text/plain" && body.data) {
    collector.bodyPlain = (collector.bodyPlain || "") + decodePart(body.data);
  } else if (mime === "text/html" && body.data) {
    collector.bodyHtml = (collector.bodyHtml || "") + decodePart(body.data);
  } else if (mime === "text/calendar" && body.data) {
    // Google/Outlook invites carry an inline text/calendar (ICS) part with the
    // structured DTSTART/SUMMARY/METHOD — far more reliable than scraping the body.
    collector.calendar = (collector.calendar || "") + decodePart(body.data);
  }

  if (Array.isArray(payload.parts)) {
    for (const child of payload.parts) walkPayload(child, collector);
  }
}

/** Strip HTML to plain text (minimal, regex-based). */
export function htmlToText(html) {
  if (!html) return "";
  let s = String(html);
  // Replace block-level closers with newlines BEFORE stripping
  s = s.replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  // Convert <img alt="X"> to [image: X]
  s = s.replace(/<img\b[^>]*\balt\s*=\s*["']([^"']*)["'][^>]*>/gi, "[image: $1]");
  // Strip all remaining tags
  s = s.replace(/<[^>]+>/g, "");
  // Decode common entities
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  // Collapse whitespace
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

/** Turn an ICS DATE/DATE-TIME value into {iso, walltime, tzid, dateOnly}. Best-effort. */
function parseIcsDate(raw) {
  if (!raw) return null;
  const tzMatch = raw.match(/TZID=([^:;]+)/i);
  const tzid = tzMatch ? tzMatch[1] : null;
  const valMatch = raw.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!valMatch) return null;
  const [, Y, Mo, D, h = "00", mi = "00", s = "00", z] = valMatch;
  const walltime = `${Y}-${Mo}-${D}T${h}:${mi}:${s}`;
  const dateOnly = !valMatch[4];
  // Only a trailing Z is a true UTC instant we can safely convert. TZID/floating times
  // are kept as wall-clock + label (no unsafe reconversion).
  const iso = z ? `${walltime}Z` : null;
  return { iso, walltime, tzid: z ? "UTC" : tzid, dateOnly };
}

/** Minimal ICS parse — enough to surface a meeting in the brief. */
export function parseCalendar(ics) {
  if (!ics) return null;
  const field = (k) => {
    const m = ics.match(new RegExp("^" + k + "[^:\\r\\n]*:(.+)$", "mi"));
    return m ? m[1].trim().replace(/\\,/g, ",").replace(/\\n/gi, " ") : null;
  };
  const rawLine = (k) => {
    const m = ics.match(new RegExp("^(" + k + "[^:\\r\\n]*:[^\\r\\n]+)$", "mi"));
    return m ? m[1] : null;
  };
  const method = (field("METHOD") || "").toUpperCase();
  const status = (field("STATUS") || "").toUpperCase();
  return {
    summary: field("SUMMARY"),
    location: field("LOCATION"),
    method,
    status,
    start: parseIcsDate(rawLine("DTSTART")),
    end: parseIcsDate(rawLine("DTEND")),
  };
}

function normalizeMessage(raw) {
  const headers = raw.payload && raw.payload.headers;
  const collector = { bodyPlain: "", bodyHtml: "", attachments: [], calendar: "" };
  walkPayload(raw.payload, collector);

  const fromHeader = getHeader(headers, "From");
  const toHeader = getHeader(headers, "To");
  const ccHeader = getHeader(headers, "Cc");
  const subject = getHeader(headers, "Subject") || "(no subject)";
  const dateHeader = getHeader(headers, "Date");
  const rfcMessageId = getHeader(headers, "Message-ID");
  const referencesHeader = getHeader(headers, "References");
  const inReplyTo = getHeader(headers, "In-Reply-To");
  const autoSubmitted = getHeader(headers, "Auto-Submitted");
  const precedence = getHeader(headers, "Precedence");

  const from = parseAddress(fromHeader);
  const tos = parseAddresses(toHeader);
  const ccs = parseAddresses(ccHeader);

  // Pick the body: plain preferred, fallback to HTML stripped
  let bodyPlain = collector.bodyPlain;
  let usedHtml = false;
  if (!bodyPlain || !bodyPlain.trim()) {
    bodyPlain = htmlToText(collector.bodyHtml || "");
    usedHtml = true;
  }

  const internalDate = raw.internalDate ? Number(raw.internalDate) : null;
  return {
    id: raw.id,
    threadId: raw.threadId,
    labelIds: raw.labelIds || [],
    snippet: raw.snippet || "",
    internalDate,
    // Server-observed receipt time (epoch-ms → ISO). This is the ONLY clock the
    // reply-status aging is allowed to trust — the `Date:` header (and therefore
    // `date_iso`, which prefers it) is sender-controlled and spoofable. CIPHER-F11.
    received_iso: internalDate ? new Date(internalDate).toISOString() : null,
    date_iso: rfc2822ToIso(dateHeader) || (internalDate ? new Date(internalDate).toISOString() : null),
    subject,
    sender_name: from.name,
    sender_email: from.email,
    // To entries WITH display names preserved. A genuine reply to a newsletter
    // inherits the sender display name into To: ("King <your-name> <info@...>");
    // scraped spam carries only the bare address. The drafter's to-name gate
    // reads this; `to` below stays email-only for existing consumers.
    to_full: tos.map((a) => ({ name: a.name, email: a.email })),
    to: tos.map((a) => a.email).filter(Boolean),
    cc: ccs.map((a) => a.email).filter(Boolean),
    plaintext_body: bodyPlain,
    body_html_fallback: usedHtml,
    attachments: collector.attachments,
    raw_html: usedHtml ? collector.bodyHtml : null,
    meeting: parseCalendar(collector.calendar),
    rfc_message_id: rfcMessageId,
    references_header: referencesHeader,
    in_reply_to: inReplyTo,
    auto_submitted: autoSubmitted,
    precedence: precedence,
  };
}

/** Test-only export — normalizeMessage is otherwise internal. */
export const normalizeMessageForTest = normalizeMessage;

// ----- Drafts (reply-drafter feature) -------------------------------------
// NOTE: this file and every module importing it must NEVER gain a send
// primitive (messages.send / drafts.send / send-as). The no-send invariant is
// enforced by a static scan test in test_drafter.mjs and is the load-bearing
// security control for the reply-drafter — there is no Google OAuth scope that
// grants draft-creation without send capability, so the code surface IS the gate.

/** List all drafts belonging to a thread. Paginated. */
export async function listDraftsByThread(threadId, account = DEFAULT_ACCOUNT) {
  const gmail = await getGmailClient(account);
  const found = [];
  let pageToken;
  do {
    const res = await gmail.users.drafts.list({
      userId: "me",
      maxResults: 100,
      pageToken,
    });
    for (const d of res.data.drafts || []) {
      if (d.message && d.message.threadId === threadId) found.push(d);
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return found;
}

/** Fetch one draft by id. Returns null on 404 (draft was sent or discarded). */
export async function getDraft(draftId, account = DEFAULT_ACCOUNT) {
  const gmail = await getGmailClient(account);
  try {
    const res = await gmail.users.drafts.get({ userId: "me", id: draftId, format: "minimal" });
    return res.data;
  } catch (err) {
    if (err && (err.code === 404 || err.status === 404)) return null;
    throw err;
  }
}

/**
 * Create a draft attached to a thread. `raw` is a base64url-encoded RFC 2822
 * message (built by drafter.js's buildRawReply — threading headers included).
 */
export async function createDraft({ threadId, raw }, account = DEFAULT_ACCOUNT) {
  const gmail = await getGmailClient(account);
  const res = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { threadId, raw } },
  });
  return res.data; // { id, message: { id, threadId } }
}

/**
 * Per-account preflight (run once per account per run, from phase 2's T0).
 * Checks run cheapest-failures-first:
 *  1. scope — on-disk token scope string must include gmail.modify
 *  2. ACL — credentials.json must not be readable by Everyone/BUILTIN\Users
 *  3. identity — getAuthedEmail(account) must equal the expected address (network call last)
 * Hard-throws on any failure; the caller surfaces a loud banner.
 */
export async function assertAccountPreflight(expectedAccount) {
  const key = String(expectedAccount).toLowerCase().trim();
  const dir = resolveCredsDir(key);
  const credsPath = path.join(dir, "credentials.json");

  // 1. scope (read from disk — token responses carry a space-delimited scope string)
  const tokens = JSON.parse(await fs.readFile(credsPath, "utf8"));
  const scope = String(tokens.scope || "");
  if (!scope.includes("https://www.googleapis.com/auth/gmail.modify")) {
    throw new Error(
      `PREFLIGHT scope: token for '${key}' lacks gmail.modify (has: '${scope}') — re-run the auth ceremony`,
    );
  }

  // 2. ACL (Windows): fail if broad groups appear in the icacls output
  try {
    const { stdout } = await execFileP("icacls", [credsPath]);
    if (/Everyone|BUILTIN\\Users|Authenticated Users/i.test(stdout)) {
      throw new Error(
        `PREFLIGHT acl: ${credsPath} is readable by a broad group — run: icacls "${credsPath}" /inheritance:r /grant:r "%USERNAME%":F`,
      );
    }
  } catch (err) {
    if (err.message && err.message.startsWith("PREFLIGHT")) throw err;
    // icacls itself unavailable (non-Windows test env) — log-and-continue is fine
  }

  // 3. identity (network call last — cheapest failures first)
  const authed = await getAuthedEmail(key);
  if (authed !== key) {
    throw new Error(
      `PREFLIGHT identity: credential dir for '${key}' is authed as '${authed}' — wrong account in ${dir}`,
    );
  }
  return { authedEmail: authed };
}
