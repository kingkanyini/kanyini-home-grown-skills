#!/usr/bin/env node
// One-shot OAuth ceremony for <your-org-email>.
// Copies the GCP OAuth client keys from ~/.gmail-mcp/, runs the local-redirect
// flow with ONLY the gmail.modify scope, writes tokens to ~/.gmail-mcp-tws/,
// and locks the file ACL. Run once: node auth-tws.js
//
// ONE-WRITER INVARIANT: this script is the ONLY writer of
// ~/.gmail-mcp-tws/credentials.json (mirror of gongrzhe's role for ~/.gmail-mcp/).

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { google } from "googleapis";

const execFileP = promisify(execFile);
const SRC_DIR = path.join(os.homedir(), ".gmail-mcp");
const DST_DIR = path.join(os.homedir(), ".gmail-mcp-tws");
const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];
const EXPECTED = "<your-org-email>";

async function main() {
  await fs.mkdir(DST_DIR, { recursive: true });
  const keysRaw = await fs.readFile(path.join(SRC_DIR, "gcp-oauth.keys.json"), "utf8");
  await fs.writeFile(path.join(DST_DIR, "gcp-oauth.keys.json"), keysRaw);
  const keys = JSON.parse(keysRaw);
  const installed = keys.installed || keys.web || keys;
  // Desktop-type OAuth clients accept any loopback port at runtime (RFC 8252 §7.3),
  // regardless of the registered redirect URI. The registered URI here is bare
  // "http://localhost" (port 80 = admin-only bind on Windows), so pin a high port.
  const registered = installed.redirect_uris[0];
  const u = new URL(registered);
  if (!u.port) u.port = "53682";
  const redirect = u.toString();
  const port = Number(u.port);

  const oauth2 = new google.auth.OAuth2(installed.client_id, installed.client_secret, redirect);
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent select_account",
    scope: SCOPES,
    login_hint: EXPECTED,
  });

  console.log("\n1. A browser window will open. SIGN IN AS:", EXPECTED);
  console.log("2. Approve the gmail.modify scope.\n");
  console.log("If the browser does not open, copy this URL into it manually:\n\n" + authUrl + "\n");
  // rundll32 receives the URL as ONE argument — unlike `cmd /c start`, which
  // splits the (unquoted) URL at every `&`, truncating the OAuth query string
  // (observed live: Google rejects with "Required parameter is missing: response_type").
  await execFileP("rundll32", ["url.dll,FileProtocolHandler", authUrl]).catch(() => {});

  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, redirect);
      const c = u.searchParams.get("code");
      res.end(c ? "✓ Authorized — you can close this tab." : "Missing code.");
      if (c) { server.close(); resolve(c); }
    });
    server.on("error", reject);
    server.listen(port);
  });

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error("No refresh_token returned — remove the app's prior grant at https://myaccount.google.com/permissions and re-run.");
  }
  const credsPath = path.join(DST_DIR, "credentials.json");
  await fs.writeFile(credsPath, JSON.stringify(tokens, null, 2));

  // ACL lockdown (NSA condition #5)
  const user = process.env.USERNAME || os.userInfo().username;
  await execFileP("icacls", [credsPath, "/inheritance:r", "/grant:r", `${user}:F`]);
  console.log(`✓ ACL locked to ${user}`);

  // Identity verification
  oauth2.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const profile = await gmail.users.getProfile({ userId: "me" });
  const authed = (profile.data.emailAddress || "").toLowerCase();
  if (authed !== EXPECTED) {
    await fs.unlink(credsPath);
    throw new Error(`Signed in as '${authed}', expected '${EXPECTED}'. Credentials deleted — re-run and pick the right account.`);
  }
  console.log(`✓ Authed as ${authed}. Tokens at ${credsPath}. Scope: ${tokens.scope}`);
}

main().catch((err) => { console.error("FAILED:", err.message); process.exit(1); });
