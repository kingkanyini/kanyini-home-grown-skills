# Dependency Graph

Per PLAN-v3.1 §2.5. Three views: (1) Mermaid DAG of skill→skill dependencies, (2) cross-matrix of prereq class × dep tier, (3) MCP reverse-index for `hermes-doctor` (Phase 2).

## 1. Skill → Skill DAG

```mermaid
graph LR
    offer-optimizer --> ad-copy-forge
    propaganda-machine --> ad-copy-forge
    offer-optimizer --> propaganda-machine
    offer-optimizer --> webinar-forge
```

Soft dependencies (`recommends:`) are not shown — they cascade noise; see per-skill `plugin.json` for the full list.

## 2. Cross-Matrix (Prereq Class × Dep Tier)

Two orthogonal taxonomies — skill→skill graph tier AND external-prereq class. Both matter for install ordering and `hermes-doctor` (Phase 2).

| Skill | Dep Tier | Prereq Class |
|-------|----------|--------------|
| `ad-copy-forge` | LEAF | Standalone |
| `ad-decoder` | ROOT | Service-only |
| `belief-shift-e-engine` | ROOT | Standalone |
| `charisma-codes` | ROOT | Standalone |
| `council-primer` | ROOT | Standalone |
| `counsel-dispatch` | ROOT | Standalone |
| `daily-email-digest` | ROOT | Standalone |
| `exportskill` | ROOT | Standalone |
| `five-min-texter` | ROOT | Heavy-prereq |
| `funnel-audit` | ROOT | Standalone |
| `funnel-hack-lvl-1` | ROOT | Standalone |
| `funnel-hack-research` | ROOT | Standalone |
| `funnel-translate` | ROOT | Service-only |
| `headline-creator` | ROOT | Standalone |
| `learn-eval` | ROOT | Standalone |
| `magnetic-offer-blueprint` | ROOT | Standalone |
| `obsidian-brain-install` | ROOT | Service-only |
| `offer-optimizer` | ROOT | Heavy-prereq |
| `overlay-director` | ROOT | Service-only |
| `perplexity-research` | ROOT | Heavy-prereq |
| `power-clip-pro` | ROOT | Standalone |
| `propaganda-machine` | MID | Standalone |
| `quicksave` | ROOT | Standalone |
| `quickshare` | ROOT | Standalone |
| `savepoint` | ROOT | Service-only |
| `sixth-sense` | ROOT | Service-only |
| `sixth-sense-sage` | ROOT | Service-only |
| `sixth-sense-scissors` | ROOT | Service-only |
| `sixth-sense-xray` | ROOT | Service-only |
| `skill-to-site` | ROOT | Service-only |
| `snapshot` | ROOT | Service-only |
| `soulcial-media-engine` | ROOT | Standalone |
| `soulcial-posts-v2` | ROOT | Heavy-prereq |
| `ss-ad-generator` | ROOT | Standalone |
| `transcript-extractor-plus` | ROOT | Service-only |
| `voice-dna-blueprint-builder` | ROOT | Standalone |
| `voice-dna-extractor` | ROOT | Heavy-prereq |
| `voice-profile-build` | ROOT | Vault-only |
| `vsl-activator` | ROOT | Standalone |
| `web-dev-bot` | ROOT | Heavy-prereq |
| `webinar-dev-bot` | ROOT | Service-only |
| `webinar-forge` | MID | Service-only |

## 3. MCP Reverse-Index

When an MCP server is down or missing, which skills break? `hermes-doctor` (Phase 2) uses this to answer in O(1).

| MCP Family | Skills That Depend On It |
|------------|--------------------------|
| `mcp__blotato__` | `soulcial-posts-v2` |
| `mcp__claude_ai_Canva__` | `offer-optimizer` |
| `mcp__ffmpeg-mcp__` | `voice-dna-extractor` |
| `mcp__n8n-mcp__` | `five-min-texter` |
| `mcp__perplexity__` | `perplexity-research`, `voice-profile-build` |
| `mcp__playwright__` | `web-dev-bot` |
| `mcp__yt-dlp-mcp__` | `voice-dna-extractor`, `voice-profile-build` |
