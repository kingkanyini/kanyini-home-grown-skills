// Shared helpers: env loading, path resolution, sanitization, logging.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

export const VAULT_ROOT =
  process.env.VAULT_ROOT ||
  "C:\\Users\\<your-username>\\<your-vault-path>";

export const CLIENTS_DIR = path.join(VAULT_ROOT, "context", "clients");

const ENV_FILE = process.env.INBOX_DIGEST_ENV || path.join(os.homedir(), ".env.env");

/**
 * Parse a minimal .env file: lines like KEY=value or `export KEY=value`,
 * ignore #comments and blanks. Values can be unquoted, "double-quoted", or
 * 'single-quoted'. No escape sequences.
 */
export async function loadEnv() {
  try {
    const raw = await fs.readFile(ENV_FILE, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      // Empty values (e.g. `export FOO=`) are stored as empty string —
      // downstream code can still detect "key missing" via `!process.env.FOO`.
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    // Missing env file is fine — env may already be set by the launcher.
  }
}

export function logDir() {
  const dir =
    process.env.INBOX_DIGEST_LOG_DIR ||
    path.join(process.env.LOCALAPPDATA || os.tmpdir(), "inbox-digest-cron");
  return dir;
}

export async function logLine(line) {
  const dir = logDir();
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `digest-${todayIso()}.log`);
  await fs.appendFile(file, `${new Date().toISOString()} ${line}\n`);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function nowIsoUtc() {
  return new Date().toISOString();
}

/** Slugify a subject line for use in a filename. */
export function slugifySubject(subj) {
  let s = String(subj || "").toLowerCase();
  // Strip leading Re: / Fwd: markers (repeatable)
  s = s.replace(/^\s*(re|fwd?)\s*:\s*/gi, "");
  while (/^(re|fwd?):/i.test(s)) s = s.replace(/^(re|fwd?):/i, "").trim();
  s = s.replace(/[^a-z0-9]+/g, "-");
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return s.slice(0, 60) || "no-subject";
}

/** Sanitize an attachment filename to alphanumerics + dot/hyphen/underscore, max 100 chars. */
export function sanitizeAttachmentName(name) {
  let base = path.basename(String(name || "attachment"));
  base = base.replace(/[^A-Za-z0-9._-]+/g, "-");
  base = base.replace(/-+/g, "-").replace(/^[-.]+/, "");
  return base.slice(0, 100) || "attachment";
}

/** Sanitize a message body for safe inclusion inside a fenced code block. */
export function sanitizeBody(body) {
  if (!body) return "";
  let out = String(body);
  // Escape literal `---` lines (would otherwise terminate frontmatter if re-parsed).
  out = out.replace(/^[ \t]*---[ \t]*$/gm, "\\---");
  // Neuter triple backticks so user content can't close the fence.
  out = out.replace(/```/g, "​```​");
  return out;
}

/** HTML-escape a header field. */
export function htmlEscape(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\r?\n/g, " ");
}

/** Atomic file write: write to .tmp then rename. */
export async function atomicWrite(targetPath, contents) {
  const tmp = `${targetPath}.tmp`;
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(tmp, contents, "utf8");
  await fs.rename(tmp, targetPath);
}

/** Parse "From: Display Name <email@host>" into {name, email}. */
export function parseAddress(header) {
  if (!header) return { name: "", email: "" };
  const m = String(header).match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].replace(/^"|"$/g, ""), email: m[2].toLowerCase() };
  const trimmed = String(header).trim();
  if (trimmed.includes("@")) return { name: "", email: trimmed.toLowerCase() };
  return { name: trimmed, email: "" };
}

/** Parse a comma-separated address header into [{name,email},...]. */
export function parseAddresses(header) {
  if (!header) return [];
  // Naive split — Gmail headers are well-formed enough for this not to matter.
  return String(header)
    .split(/,(?=(?:[^"]|"[^"]*")*$)/)
    .map((s) => parseAddress(s));
}

/** RFC 2822 -> ISO 8601 UTC. */
export function rfc2822ToIso(rfc) {
  if (!rfc) return null;
  const d = new Date(rfc);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Gmail-style date for `after:` query param, format YYYY/MM/DD. */
export function toGmailDate(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

/** Append a single JSON object as a line to a .jsonl file. */
export async function appendJsonl(filePath, obj) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, JSON.stringify(obj) + "\n", "utf8");
}

/** Read all entries from a .jsonl file into an array. */
export async function readJsonl(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

/** Quick logger that also writes to the daily log. */
export async function log(level, msg) {
  const line = `${level.toUpperCase()} ${msg}`;
  // eslint-disable-next-line no-console
  console.log(line);
  await logLine(line);
}
