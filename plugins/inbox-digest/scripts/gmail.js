// Gmail API wrapper. Reuses the gongrzhe OAuth credentials at ~/.gmail-mcp/.
// All MIME / part walking happens here so phase2 deals in clean message objects.

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { google } from "googleapis";
import { parseAddress, parseAddresses, rfc2822ToIso } from "./util.js";

const CREDENTIALS_FILE = path.join(os.homedir(), ".gmail-mcp", "credentials.json");
const OAUTH_KEYS_FILE = path.join(os.homedir(), ".gmail-mcp", "gcp-oauth.keys.json");

let _gmailClient = null;
let _oauthClient = null;

/**
 * Build an authenticated Gmail v1 client. Refreshes tokens automatically.
 * Persists refreshed tokens back to ~/.gmail-mcp/credentials.json so future
 * runs use the latest token.
 */
export async function getGmailClient() {
  if (_gmailClient) return _gmailClient;

  const [keyRaw, credRaw] = await Promise.all([
    fs.readFile(OAUTH_KEYS_FILE, "utf8"),
    fs.readFile(CREDENTIALS_FILE, "utf8"),
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

  // INTENTIONALLY do NOT persist refreshed tokens.
  // gongrzhe's Gmail-MCP-Server (the other consumer of this credentials file)
  // is read-only after the initial OAuth callback — verified by source review
  // of https://github.com/GongRzhe/Gmail-MCP-Server. By also not writing here,
  // we guarantee exactly one writer (gongrzhe at install time only) and zero
  // race conditions between concurrent cron runs and interactive Claude Code
  // sessions. googleapis still refreshes the access_token in-memory per run
  // using the stable refresh_token from disk; the new access_token vaporizes
  // when the script exits, which is correct.

  _oauthClient = oauth2;
  _gmailClient = google.gmail({ version: "v1", auth: oauth2 });
  return _gmailClient;
}

/**
 * Probe authentication. Returns the email address of the authed account.
 */
export async function getAuthedEmail() {
  const gmail = await getGmailClient();
  const res = await gmail.users.getProfile({ userId: "me" });
  return (res.data.emailAddress || "").toLowerCase();
}

/**
 * List messages matching a Gmail query. Handles pagination internally.
 * Returns an array of {id, threadId} pairs (gmail's stub shape).
 */
export async function listMessages(query, options = {}) {
  const gmail = await getGmailClient();
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
export async function getMessage(messageId) {
  const gmail = await getGmailClient();
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
export async function downloadAttachment(messageId, attachmentId, outPath) {
  const gmail = await getGmailClient();
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

function normalizeMessage(raw) {
  const headers = raw.payload && raw.payload.headers;
  const collector = { bodyPlain: "", bodyHtml: "", attachments: [] };
  walkPayload(raw.payload, collector);

  const fromHeader = getHeader(headers, "From");
  const toHeader = getHeader(headers, "To");
  const ccHeader = getHeader(headers, "Cc");
  const subject = getHeader(headers, "Subject") || "(no subject)";
  const dateHeader = getHeader(headers, "Date");

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

  return {
    id: raw.id,
    threadId: raw.threadId,
    labelIds: raw.labelIds || [],
    snippet: raw.snippet || "",
    internalDate: raw.internalDate ? Number(raw.internalDate) : null,
    date_iso: rfc2822ToIso(dateHeader) || (raw.internalDate ? new Date(Number(raw.internalDate)).toISOString() : null),
    subject,
    sender_name: from.name,
    sender_email: from.email,
    to: tos.map((a) => a.email).filter(Boolean),
    cc: ccs.map((a) => a.email).filter(Boolean),
    plaintext_body: bodyPlain,
    body_html_fallback: usedHtml,
    attachments: collector.attachments,
    raw_html: usedHtml ? collector.bodyHtml : null,
  };
}
