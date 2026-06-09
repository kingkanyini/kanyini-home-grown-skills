# Dependency Graph

Per PLAN-v3.1 §2.5. Three views: (1) Mermaid DAG of skill→skill dependencies, (2) cross-matrix of prereq class × dep tier, (3) MCP reverse-index for `hermes-doctor` (Phase 2).

## 1. Skill → Skill DAG

```mermaid
graph LR
    offer-optimizer --> ad-copy-forge
    propaganda-machine --> ad-copy-forge
    voice-dna-blueprint-builder --> daily-email-digest
    voice-dna-blueprint-builder --> propaganda-machine
    offer-optimizer --> propaganda-machine
    voice-dna-extractor --> voice-dna-blueprint-builder
    voice-dna-blueprint-builder --> webinar-forge
```

Soft dependencies (`recommends:`) are not shown — they cascade noise; see per-skill `plugin.json` for the full list.

## 2. Cross-Matrix (Prereq Class × Dep Tier)

Two orthogonal taxonomies — skill→skill graph tier AND external-prereq class. Both matter for install ordering and `hermes-doctor` (Phase 2).

| Skill | Dep Tier | Prereq Class |
|-------|----------|--------------|
| `ad-copy-forge` | LEAF | Standalone |
| `belief-shift-e-engine` | ROOT | Standalone |
| `charisma-codes` | ROOT | Standalone |
| `council-primer` | ROOT | Standalone |
| `counsel-dispatch` | ROOT | Standalone |
| `daily-email-digest` | MID | Standalone |
| `exportskill` | ROOT | Standalone |
| `funnel-audit` | ROOT | Standalone |
| `funnel-hack-lvl-1` | ROOT | Standalone |
| `funnel-hack-research` | ROOT | Standalone |
| `funnel-translate` | ROOT | Service-only |
| `headline-creator` | ROOT | Standalone |
| `inbox-digest` | ROOT | Heavy-prereq |
| `learn-eval` | ROOT | Standalone |
| `magnetic-offer-blueprint` | ROOT | Standalone |
| `morning-compass` | ROOT | Heavy-prereq |
| `offer-optimizer` | ROOT | Heavy-prereq |
| `overlay-director` | ROOT | Service-only |
| `perplexity-research` | ROOT | Heavy-prereq |
| `power-clip-pro` | ROOT | Standalone |
| `propaganda-machine` | LEAF | Standalone |
| `quicksave` | ROOT | Standalone |
| `quickshare` | ROOT | Standalone |
| `savepoint` | ROOT | Service-only |
| `skill-to-site` | ROOT | Service-only |
| `ss-ad-generator` | ROOT | Standalone |
| `voice-dna-blueprint-builder` | MID | Standalone |
| `voice-dna-extractor` | ROOT | Heavy-prereq |
| `vsl-activator` | ROOT | Standalone |
| `web-dev-bot` | ROOT | Heavy-prereq |
| `webinar-forge` | MID | Standalone |

## 3. MCP Reverse-Index

When an MCP server is down or missing, which skills break? `hermes-doctor` (Phase 2) uses this to answer in O(1).

| MCP Family | Skills That Depend On It |
|------------|--------------------------|
| `mcp__claude_ai_Canva__` | `offer-optimizer` |
| `mcp__composio__` | `morning-compass` |
| `mcp__ffmpeg-mcp__` | `voice-dna-extractor` |
| `mcp__gmail-gong-mcp__` | `inbox-digest` |
| `mcp__perplexity__` | `perplexity-research` |
| `mcp__playwright__` | `web-dev-bot` |
| `mcp__yt-dlp-mcp__` | `voice-dna-extractor` |
