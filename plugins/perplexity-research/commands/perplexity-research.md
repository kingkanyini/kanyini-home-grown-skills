---
description: On-demand citation-rich research via Perplexity Sonar API. Use when the user says "deep research on X", "research X for me", "investigate X thoroughly", "look into X", or invokes /perplexity-research. Provides three depth tiers — Quick (~10s), Standard (~30s with reasoning), Deep (2-5min with 20+ citations) — and saves results to vault, flat file, or Google Doc.
---

# /perplexity-research

Citation-rich research via Perplexity Sonar models. Pick a tier, get a report, save where you want, ask follow-ups.

## Step 0: Ethics gate (silent unless triggered)

Use LLM judgment to scan the query:
- Mentions a named real person (private individual, founder, exec) → confirm framing is "study / understand" not "exploit / steal"
- Competitor research (named brand/product/company) → reframe with Life Gamer Code language
- Otherwise → silent pass-through, proceed to Step 1

If gate fires, ask via AskUserQuestion: "This query mentions [name]. Confirm framing:"
- "Study to understand" → proceed
- "Adapt principles for our work" → proceed
- "Cancel — rephrase first" → exit

## Step 1: Tier selection

If the user's query contains an explicit tier-name noun phrase, **lock that tier** (skip the question):
- "quick mode", "quick tier", "in quick" → **lock Quick**
- "deep mode", "deep tier", "deep research" → **lock Deep**
- "standard mode", "standard tier" → **lock Standard**

Otherwise, **suggest** a tier based on phrasing:
- contains "quickly", "fast", "what is X" → suggest **Quick**
- contains "deep", "comprehensive", "thorough", "exhaustive" → suggest **Deep**
- otherwise → suggest **Standard**

Then ask via AskUserQuestion with the suggested tier marked `(Recommended)`:

| Tier | Tool | Latency | Cost |
|---|---|---|---|
| Quick | `mcp__perplexity__perplexity_ask` | ~10s | ~$0.01 |
| Standard | `mcp__perplexity__perplexity_reason` | ~30s | ~$0.05 |
| Deep | `mcp__perplexity__perplexity_research` | 2-5min | $0.50-$5 |

## Step 2: Cost gate (Deep tier only)

If Deep tier was chosen, ask via AskUserQuestion:
> "Deep mode runs 2-5 min and may cost up to $5. Proceed?"

Options: "Proceed with Deep" / "Downgrade to Standard" / "Cancel"

## Step 3: Run the research

Show: "⏳ Researching… expected [Quick:10s | Standard:30s | Deep:2-5min]"

Call the matching MCP tool with the user's query. Pass no system instruction unless the user provided one.

## Step 4: Present the result

Render the response inline as markdown:
- **Summary** (1-2 paragraphs from Perplexity's response)
- **Key findings** (bullets or sub-sections)
- **Citations** (numbered, with URLs)

## Step 5: Save destination

Ask via AskUserQuestion:
- "Save to vault" → use `mcp__obsidian-brain__write_note` with path `research/YYYY-MM-DD-<slug>.md` and frontmatter (`type: research`, `tier`, `query`, `model`, `created`, `confidence: medium`)
- "Save to flat file" → write to `~/.claude/projects/research/YYYY-MM-DD-<slug>.md`
- "Save to Google Doc" → invoke `/google-doc-builder` skill protocols
- "Skip — don't save"

`<slug>` = kebab-case from query keywords, max 60 chars.

If "Save to vault" fails (obsidian-brain MCP offline), auto-fall back to flat file save and notify: "vault offline — saved to flat file at [path]".

## Step 6: Follow-up loop

Ask via AskUserQuestion:
- "Follow-up question" → reuse same tier; pass previous query + answer as context, restart at Step 3
- "New query (different topic)" → restart at Step 0 (re-runs ethics gate)
- "Exit" → proceed to Step 7

## Step 7: AI-isms scan (silent unless matches)

Scan ALL skill-authored summary text (NOT raw Perplexity output) for:
- AI-isms ban list: "dive deep", "deep dive", "leverage" (verb), "unlock", "here's the thing", "let me be real", metaphorical "navigate"
- "you're not broken" cliché → replace with "you may feel broken, but…"
- Language Rules violations: "steal", "copy", "rip off", exploitative "hack"

Auto-revise inline. If 2+ matches, flag count: "Caught [N] AI-isms, cleaned them up."
