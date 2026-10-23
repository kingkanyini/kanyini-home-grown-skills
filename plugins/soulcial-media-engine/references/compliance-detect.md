# Soulcial Media Engine — Compliance-Detect Reference

**Canonical source for:** regulated-niche detection (sets `regulated_flag` in `phase-0-intake.md`)
and the claims-safe copy block (rendered into deliverables by `assembly.md`).

**Safety level: HIGH — FAIL-CLOSED gate.**
When in doubt, include the compliance block. A false alarm adds a disclaimer.
A false pass ships non-compliant health or finance claims under a client's name.
Silent misses cause real harm; over-blocking does not.

---

## ⚠ FAIL-CLOSED RULE (READ FIRST — NON-BYPASSABLE)

> **Include the compliance block when ANY of the following is true:**
> - A regulated niche is detected (Section 1 match).
> - Detection is ambiguous — niche language is adjacent or borderline.
> - The Security-voice answer (Phase 0 intake question) is non-empty or unclear.
>
> **Omit ONLY when ALL THREE hold:** the niche is explicitly, positively matched as
> non-regulated (e.g., photography, cooking, travel, fashion) AND none of the
> keyword-light phrasings in Section 1 appear in the content brief AND the
> Security-voice answer (Phase 0 intake) is empty/clear. If any one of the three
> is not satisfied → include.
>
> **When uncertain → include.** The cost of a false alarm (one extra disclaimer)
> is always lower than the cost of a false pass (shipped medical or financial claim).

This rule is the direct application of the `safety-gate-fail-closed-asymmetry`
learned skill: the gate's error direction is over-block, never under-detect.

---

## Section 1: Regulated-Niche List

### Primary Regulated Categories

| Category | Explicit Signals | Keyword-Light Phrasings (evasive — must also trigger) |
|---|---|---|
| **Health / Medical** | cure, heal, treat, diagnose, disease, illness, symptom, clinical, FDA | "feel like yourself again," "what your doctor won't tell you," "root cause solution," "fix your body," "finally get relief" |
| **Wellness / Supplements** | supplement, herb, nutrient, vitamin, detox, cleanse, probiotic, superfood | "balance hormones naturally," "support your gut health," "nourish from within," "optimize your system," "boost your immune response" |
| **Mental Health** | anxiety, depression, trauma, PTSD, therapy, therapist, mental illness, psychiatric | "calm your nervous system," "rewire your brain," "release stored trauma," "regulate your emotions," "stop the spiral" |
| **Finance / Investing** | invest, stock, crypto, portfolio, return, yield, passive income, wealth building | "grow your money," "make your money work," "quit your 9-to-5," "financial freedom in 90 days," "build wealth on autopilot" |
| **Weight Loss** | lose weight, fat loss, metabolism, calorie, diet, obesity, BMI, slim | "drop the pounds," "shed inches," "melt fat naturally," "finally fit in those jeans," "reset your metabolism" |
| **Legal** | lawsuit, sue, attorney, lawyer, legal rights, court, liability, contract dispute | "know your rights," "they can't do that to you," "fight back legally," "what the law says about your situation" |

### Detection Logic (Phase 0 sets `regulated_flag`)

```
IF niche_keyword IN (explicit signals OR keyword-light phrasings) → regulated_flag = TRUE
IF niche is borderline / overlapping categories               → regulated_flag = TRUE (ambiguous = include)
IF security_voice_answer is non-empty OR unclear              → regulated_flag = TRUE
IF niche is positively identified as non-regulated
   AND no keyword-light phrasings appear in brief
   AND security_voice_answer is empty/clear                   → regulated_flag = FALSE (omit)
ELSE                                                          → regulated_flag = TRUE  (default = include)
```

**Default is TRUE.** `regulated_flag` starts as TRUE at Phase 0 intake and is only
set to FALSE by an explicit, confident non-regulated match with no borderline signals.

---

## Section 2: Claims-Safe Copy Block — "Never Say / Say Instead"

### How `assembly.md` renders this block

When `regulated_flag = TRUE`, `assembly.md` injects the appropriate rows from this
table into the deliverables as inline guardrails. Claims in the draft are cross-checked
against the "Never Say" column before output.

### Health & Wellness Rows

| Never Say | Why It's Risky | Say Instead |
|---|---|---|
| "This will **cure** your [condition]" | Medical claim — requires FDA evidence | "This supports your body's natural process" |
| "**Treat** [symptom/disease] naturally" | Treatment language implies clinical efficacy | "May help ease [symptom] — results vary" |
| "**Diagnose** whether you have [condition]" | Diagnosis is a licensed medical act | "Explore whether [symptom] resonates for you" |
| "Guaranteed to **heal** your [issue]" | Unsubstantiated health guarantee | "In my experience, this helped with [issue]" |
| "**Proven** to balance your hormones" | Clinical proof claim without citation | "Many clients find this supports hormonal balance" |
| "**Clinically proven** supplement" | Requires peer-reviewed trial evidence | "Research suggests / some studies show" |
| "**Detox** your body in 3 days" | Detox is a medically loaded term | "Support your body's natural cleansing process" |
| "**Rewires** your brain to eliminate anxiety" | Neurological overclaim | "Practices that support a calmer nervous system" |
| "**Cure** trauma with this method" | Trauma treatment is a clinical domain | "A process that helped me work through grief and stored emotion" |

### Finance & Investing Rows

| Never Say | Why It's Risky | Say Instead |
|---|---|---|
| "**Guaranteed returns** on your investment" | No investment return can be guaranteed | "Historically, this approach has generated [X]% — not financial advice" |
| "**Risk-free** investing" | All investments carry risk — this is a legal violation | "Lower-volatility approach — all investing carries risk" |
| "This **will make you money**" | Outcome guarantee — securities law violation risk | "In my experience, this strategy has worked — results vary" |
| "**Financial freedom** in 90 days" | Time-bound income promise | "A path toward more financial flexibility — timelines vary" |
| "**Passive income** while you sleep (guaranteed)" | Income guarantee | "Income potential from [strategy] — requires setup, not passive day one" |
| "I'm **not a financial advisor** but you should invest in X" | Disclaimer + recommendation = still advice | "I'm not a financial advisor. This is what I did — consult a professional." |
| "**Double your money** with this system" | Specific return promise | "Some members have seen significant growth — not typical, not guaranteed" |

### Legal Rows

| Never Say | Why It's Risky | Say Instead |
|---|---|---|
| "**You should sue** them" | Directing legal action — unauthorized legal advice | "You may have options — consult an attorney to understand your rights" |
| "**Legal advice**: here's what to do" | Offering legal advice without a law license | "This is general information only — not legal advice" |
| "**You have a case** against them" | Case assessment requires licensed counsel | "This situation may warrant legal review — speak to an attorney" |
| "**They can't legally do that**" | Legal conclusion — requires jurisdiction-specific analysis | "This seems inconsistent with common practice — a lawyer can clarify your rights" |
| "I guarantee you'll **win** this case" | Outcome promise in a legal context | "Many people in similar situations have found favorable outcomes — no guarantees" |

---

## Section 3: Compliance Block Template

When `regulated_flag = TRUE`, `assembly.md` appends this block to every deliverable
in which health, wellness, finance, weight loss, or legal content appears.

```
---
⚖️ COMPLIANCE NOTE (auto-generated — review before publishing)

This content touches a regulated category. Before publishing:
• Replace any "Never Say" phrases (see compliance-detect reference) with
  "Say Instead" alternatives.
• Add platform-required disclosures where applicable (FTC, SEC, medical disclaimer).
• Claims flagged below are placeholders — verify against your actual evidence before use.
• This skill does NOT clear content for legal or medical compliance. Human review required.

Regulated flag reason: [detected category / ambiguous detection / Security-voice signal]
---
```

---

## Section 4: Consuming Module Reference

### `phase-0-intake.md` (flag-setter)

Phase 0 reads Section 1 of this file to evaluate the niche entered by the user.
It sets `regulated_flag` in the `00-master-brief.md` session artifact.
Detection fires on: niche label, stated content topics, target audience description,
AND the Security-voice intake question answer (if non-empty or ambiguous → flag TRUE).

### `assembly.md` (block-renderer)

Assembly reads `regulated_flag` from `00-master-brief.md`. When TRUE:
1. Cross-checks all draft copy against Section 2 (Never Say column).
2. Replaces any matches with the "Say Instead" alternative, flagged with `[COMPLIANCE EDIT]`.
3. Appends the Section 3 compliance block at the bottom of the deliverable.
4. Never silently passes content that contains a "Never Say" phrase — block always triggers.

---

## Section 5: False-Alarm Cost vs. False-Pass Cost

| Scenario | Cost |
|---|---|
| False alarm (non-regulated content gets a disclaimer) | Minor friction — remove the disclaimer before publishing |
| False pass (regulated claim ships without disclaimer) | FTC enforcement risk, client reputation damage, platform account ban, legal liability |

**Asymmetry is intentional.** This gate is designed to err toward disclaimers.
The human reviewing the deliverable is the final ship gate — the gate's job is to
ensure that gate is never skipped for regulated content.

Canonical principle: `safety-gate-fail-closed-asymmetry` (learned skill, 2026-06-29)
