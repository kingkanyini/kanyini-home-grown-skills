# Team Weekly Digest — Go-Live Runbook (per recipient)

**PRECONDITION (computed, not vibes):** ≥2 consecutive ✅-approved shadow windows for
the recipient in `digest-state.json` (`consecutiveApprovals ≥ 2` — you approve a
shadow by ✅-reacting the 🕶️ post in #command-center; the next sweep records it).

1. **Code change (SAME change as the scope, or every sweep fires SCOPE DRIFT):**
   in `scripts/slack.js`, change
   `export const GUTSY_SCOPES = ["chat:write"];` →
   `export const GUTSY_SCOPES = ["chat:write", "im:write"];`
2. At api.slack.com → **Gutsy** → OAuth & Permissions: add `im:write` → **Reinstall
   to Workspace** → copy the new token → replace `SLACK_GUTSY_TOKEN` in
   `~/.env.env` (the old token dies on reinstall; rotation runbook applies).
3. Verify: `node scripts/slack.js --check` → both apps ✓, scopes exact match.
4. **Blast-radius note** (append to `slack-token-rotation.md` at this step): with
   `im:write`, a leaked Gutsy token can DM anyone in the workspace as a trusted
   persona — rotation urgency is HIGH; the code-level send guard (configured
   recipients only) is the compensating control.
5. **Intro handshake (manual, v1):** BEFORE flipping the config, <your-name> sends (or
   has Gutsy post via a one-shot) the intro to the recipient: what Gutsy is, weekly
   cadence, and the reply contract — "I can't read replies in this DM yet; anything
   you want acted on, tell <your-name> or post in a channel." Confirm with the recipient
   in person that it landed with the RIGHT human (identity verification without a
   users:read scope).
6. Flip the recipient's `mode: live` in the hub `slack:` → `digests:` block.
7. Next due window (Friday evening): first content DM. Watch the `📨 delivered`
   registry line + the ledger's `sent_ts`.
8. Week 4: the Friday 📊 tally prompts the keep/change/kill check — ask the
   recipient, then set `value_checked: true` on their `digest-state.json` entry
   (records the answer; stops the prompt).

**Opt-out:** recipient tells <your-name> → set `mode: shadow` (or remove the entry).
Any pending delivery cancels automatically at the next sweep (window-end expiry +
mode revalidation are code-enforced).
