---
name: post-scheduler-v2
description: Publish or schedule an approved, ethics-cleared post to live platforms (Instagram, Facebook, LinkedIn, X, TikTok, Threads, Bluesky, YouTube) via the Blotato MCP. OFF by default and fully offline until you explicitly say "publish" — then a harness-enforced, single-use armed gate opens. Idempotent (no double-posts), graceful copy-paste fallback if the MCP isn't set up. Triggers on "publish this," "schedule this to [platform]," or the final step of content-coach-v2. Blotato post-scheduler adapted + hardened.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion, mcp__blotato__blotato_list_accounts, mcp__blotato__blotato_create_post, mcp__blotato__blotato_get_post_status
---

# Post Scheduler v2 (MCP-gated, hardened)

Ship an approved post through Blotato. Copy is out of scope here, no writing and no revising — any post that gets this far is already graded AND `Ethics: cleared`. If Blotato isn't set up, fall back to a paste-file. Never fail the flow.

> **Source & Attribution:** Adapted (not copied) from Blotato's `post-scheduler` (blotato.com · GitHub Blotato-Inc/blotato-skills). Blotato's skills remain unmodified.

## Gating (offline by default)
- `ship_enabled` (session, default **false**). While false, this skill does not load its MCP path and no `mcp__blotato__*` tool is reachable.
- `mcp_access_granted = ship_enabled AND explicit_publish_intent AND prepublish_checklist_passed AND target_confirmed AND ethics_cleared`.
- **Explicit intent only** ("publish", "schedule this", "post this to X", "ship it") AFTER a post is approved. Auto-progression never arms it. Anchor shows `MCP: locked|armed`; compaction re-derives to `locked`.
- **Harness boundary:** a `settings.json` PreToolUse hook denies every `mcp__blotato__*` call unless a **single-use armed sentinel** exists (written only when all five conjuncts hold). The sentinel is scoped to one `publishKey` and **deleted immediately after each `create_post`** — one arming = one publish. This is the real gate; the markdown above is the intent layer.

## Flow
**S0 IDLE** (pipeline end): deliverables done, `ship_enabled=false`. Offer: *"Want me to schedule this to a live platform via Blotato? (optional — it already works without it.)"* No → done.

**S1 ARM:** explicit intent → gather post(s), platform(s), time (default `useNextFreeSlot: true`; publish-now only if the user says so). Confirm target.

**S2 PRE-PUBLISH CHECKLIST** (last safety gate): platform required fields — **Instagram `mediaUrls`** (hard fail if absent), **Facebook `pageId`**, **TikTok `privacyLevel`** + disable flags, **YouTube `title`(<100)/`privacyStatus`**; hashtag count within limits; char length ≤ limit → **ask (shorten/skip/override), never auto-truncate**; voice rows defer to `active_voice_path` — **do NOT hard-fail em dashes** (email-only rule). Any fail → stop, report, offer "send back to grader / override." `prepublish_checklist_passed` only on all-pass or explicit override.

**S3 write the single-use armed sentinel** (all five conjuncts incl. `ethics_cleared`). Write `~/.claude/.blotato-armed.json` = `{"publishKey":"<key>","targets":[<confirmed platforms>],"remaining":<N = count of confirmed platforms>,"ts":<epoch-ms>}`. `remaining` = the confirmed target-set size, so ONE arming authorizes exactly this batch (multi-platform included). The `settings.json` PreToolUse guard (`blotato-publish-guard.js`) denies every `mcp__blotato__*` call unless this sentinel exists and is <5 min old; the PostToolUse `blotato-sentinel-clear.js` deletes it right after `create_post` (one arming = one publish). Do NOT hand-write this file to bypass the flow — it is the armed-state record, not a toggle.

**S4 LIST ACCOUNTS:** first and only `mcp__blotato__blotato_list_accounts`. Group by platform; multiple → ask which. Error → S7.

**S5 IDEMPOTENT PUBLISH:** per-brand `publish-ledger.jsonl` (inside the `.client-data-boundary` folder in client mode; never a global path).
- `publishKey = HMAC-SHA256(secret, platform + accountId + normalize(text) + scheduledAt)`. `scheduledAt` = the user-chosen target captured at reserve, **reused verbatim on retry — never now()**. `secret` = a stable per-install value in an env file / OS cred store, OUTSIDE any boundary folder, never committed, never in the ledger dir. `normalize` = trim + collapse whitespace + strip trailing hashtag block.
- **Reserve-then-call:** append `{publishKey, platform, acctHash, status:"pending", ts}` via atomic temp-file rename + fsync **before** `create_post`. accountId is HMAC/hashed, never stored raw.
- Pre-call read: key + `confirmed` + `postId` → **skip** ("already scheduled, postId X"). Key + `pending`/`failed` without postId → **do NOT blind-retry**: *"a previous attempt may already be live — check my.blotato.com/scheduler before I retry."*
- On success → rewrite `confirmed` + `postId`. On failure → `failed`. Multi-platform = one `create_post` per platform, each ledger-guarded; partial failure reports success+failure separately, no rollback. The armed sentinel's `remaining` counter covers exactly this confirmed batch — the PostToolUse hook decrements per `create_post` and deletes at 0, so no re-arm is needed mid-batch, but a NEW batch needs fresh explicit intent.

**S6 REPORT** (session only): platform / @handle / time / status / postId. The `@handle` + accountId are never persisted. Point to my.blotato.com/scheduler.

**S7 GRACEFUL DEGRADATION:** MCP absent / not signed in / list_accounts errors → write `post-ready-to-paste.txt` (one block per platform, text only) in the brand folder, tell the user the path. Never fail. Append to `posts-shipped.log`.

## Errors
- **401/403** → OAuth expired; prompt reauth. **Scrub the full error body** (not just the token — bodies can echo accountId/payload) before it reaches the user or any file. Offer paste-file as secondary.
- **429** → honor `Retry-After`, one backoff retry, then S7.
- **Over char limit** → S2 ask, never auto-truncate. **Network** → retry once, then S7 + exact (scrubbed) error. Never log success without a postId.

## Client mode
Publishing client content requires an explicit **client authorization record** — an append-only attestation (who + date + platforms), stored as a fact only, NO client PII. This is an audit log for a solo operator, not enforceable dual-control. Ledger + paste-file + brand-context.md all live inside the `.client-data-boundary` folder.

## Setup (first-time)
If the Blotato MCP isn't installed, point the user to help.blotato.com/claude-skills (one-time OAuth). Until then, S7 paste-file keeps everything working.
