# Social Spine — Ethics Gate (the moat)

> **Mandatory before any skill returns public-ready social copy.** The three public-copy doors — `content-coach-v2`, `post-writer-v2`, `repurpose-v2` — MUST call this gate. viral-hooks-v2 (seeds) and brand-brief-v2 (context) produce intermediate artifacts, not ship-ready copy, and do not exit through here.
>
> **Honest scope:** this is a single-source instruction gate + (for publishing) a harness-enforced boundary. It is enforced three ways: (1) the `Ethics:` anchor contract below, (2) a build-gate script (`scripts/verify-ethics-gate.js` in soulcial-posts-v2, exit 1 on drift) that checks the 3 doors still reference this file, (3) the publish lock in post-scheduler-v2. Do not over-trust; run it honestly.

## The Ethics anchor contract
- Every session starts `Ethics: pending`. **Final public copy may NOT be emitted while `Ethics: pending`.**
- Set `Ethics: cleared` ONLY after this gate passes for the specific artifact. Compaction re-derives to `pending` (fail-closed).

## Gate sequence (run in order)

**1. Two-point ethics check** (open + close):
- Framing is study/adapt/model — never steal/copy/rip off another creator's work.
- Golden Rule: "If they saw this, would they feel honored or violated?"
- No aggressive sales, manufactured scarcity, or shaming.

**2. Voice/AI-ism scan** — check the active profile's protected tics FIRST (documented tic = not a violation), then the generalist AI-tell rules and the humanization pass in `voice.md`. Precedence per `voice.md`.

**3. Compliance / claims-safety veto** (hard) — **This is the ASSEMBLY site for the flag. Evaluate `regulated_flag = armFloor || detect(finalCopy)` HERE, on the final copy.**
- `armFloor` is the card-derived floor produced ONCE by `client-card.md` (its sole producer) — **consume it as-is; do NOT re-derive it from raw `active_client_profile.regulated`** (a second derivation drifts on the missing-field case). No client profile → `armFloor = false`.
- `detect(finalCopy)` runs `references/compliance-detect.md` Section 1 on the **FINAL assembled copy including any inserted disclaimer**. It can only **ESCALATE** the floor, never lower it — so an explicit `regulated: false` card over weight-loss copy still arms (fail-closed: ambiguous niche → regulated).
- When `regulated_flag` is armed: apply the "Never Say / Say Instead" table, inject the card's `compliance_disclaimer`, and run the banned-claim veto on the final copy. The card's `banned_claim_classes` is an **ADDITIVE UNION** with compliance-detect.md's global list, never a replacement.
- A post that makes an uncovered health/finance/legal claim is **BLOCKED** regardless of virality.

**4. Soul-lens ceiling veto** (hard, self mode) — run `references/soul-lens-rubric.md`. No spiritual-bypassing; validate feeling before reframe; overt ≠ preachy. A post that bypasses is **BLOCKED**.

**5. Read-through ship gate** — present the clean final artifact inline for the user's (or the client-approver's) explicit read-through approval. **This, not any score, is the final ship gate.**

## Precedence when the mechanical virality grader disagrees
**Compliance/claims-safety veto > Soul-lens ceiling veto > virality score floor (≥8) > all other dimensions.** A 9/10-virality post that fails a veto is BLOCKED. Virality is necessary, never sufficient.

Only after steps 1–5 pass: set `Ethics: cleared`, then the copy may ship / go to publish.
