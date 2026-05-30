---
description: Turn any installed Claude Code skill into a deployed Vercel chat site (Next.js + streaming Anthropic API + secret-safe env piping). Interactive interview through skill selection, style, hosting, and deploy.
---

# Skill to Site

You are turning one of <your-name>'s existing Claude Code skills into a working web demo — a Next.js chat site, powered by the Anthropic API, deployable to Vercel, that the skill's audience (clients, students, family) can use without ever opening Claude Code.

This skill is **interactive**. Walk through five phases via `AskUserQuestion`, confirming before destructive or external actions. Don't autopilot.

## Foundational Facts

- **Reference build:** `~/.claude/projects/shameless-vision-site/` was the first instance. Mirror its file structure unless the user requests changes.
- **API key store:** <your-name>'s working ANTHROPIC_API_KEY lives at `~/.claude/projects/aftercare/.env.local` under the literal `ANTHROPIC_API_KEY=` line. Never print, log, copy into a variable, or echo this value. Pipe directly via stdin from file → `vercel env add`.
- **Default model:** `claude-opus-4-7` with adaptive thinking off (recorder workflows are mostly verbatim reads + classification — don't burn thinking tokens). Override only if the source skill is reasoning-heavy.
- **Default destination:** `~/.claude/projects/[skill-name]-site/`.
- **Default style:** workbook tone (cream `#F4F1EA` bg, deep forest `#3F4A36` accent, terracotta `#A0522D` warm accent, Fraunces serif headlines, Inter body). Override on user request.

## Phase 1 — Discovery (interview)

Ask via `AskUserQuestion`:

> *"Which skill do you want to turn into a live site?"*

Don't pre-fill the option list. The user types or picks. Resolve the answer to one of:

- `~/.claude/plugins/local/[skill]/commands/[skill].md`
- `~/.claude/plugins/local/[skill]/commands/[skill]/[main].md`

If the skill name is ambiguous, list candidates via `Glob plugins/local/*/commands/*.md` and `AskUserQuestion` to disambiguate.

Once resolved, **read the skill MD fully**. Parse:
- The skill's role (recorder, coach, creator, scanner, etc.)
- Platform-coupled sections (filesystem writes, Google Doc tooling, MCP tool dependencies, Bash/Write/Edit references, session JSON paths)
- Verbatim content the model must preserve (workbook prompts, scripts, examples, framings)
- Output format (markdown, file, Google Doc, etc.)

Confirm with the user the **scope**:

> *"I'll wrap [SKILL] as a chat site at `~/.claude/projects/[skill]-site/`. The skill currently does X, Y, Z. On the web it'll need to: [list portable-path adaptations]. Sound right?"*

`AskUserQuestion` options: `Looks right`, `Adjust scope`, `Cancel`.

## Phase 2 — Style

`AskUserQuestion`:

> *"Visual style?"*

- **Workbook tone (Recommended)** — calm cream/forest, Fraunces serif. Sacred-but-modern. Default.
- **Modern minimal** — white bg, Inter sans only, neutral accent. Safer for client work where they'll re-skin.
- **Match skill voice** — describe the skill's energetic field, then propose 4 directions (per CLAUDE.md frontend-design pattern: bg hex / accent hex / typeface / one-line rationale). User picks one.
- **Pass through to design-dials** — invoke `/design-dials` first, then return.

Store the chosen palette + typography in a small object you'll reuse when generating `app/globals.css`.

## Phase 3 — Project setup

State what you'll create. Confirm via `AskUserQuestion` before writing files.

Then write these files to `~/.claude/projects/[skill-name]-site/`:

### File: `package.json`
```json
{
  "name": "[skill-name]-site",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.40.1",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

### File: `tsconfig.json`
Standard Next.js 15 / App Router config with `paths: { "@/*": ["./*"] }`.

### File: `next.config.mjs`
Minimal default export.

### File: `next-env.d.ts`
Standard `/// <reference types="next" />` declarations.

### File: `.gitignore`
```
node_modules/
.next/
.env
.env.local
.env*.local
*.log
.DS_Store
.vercel
```

### File: `.env.local.example`
Single line: `ANTHROPIC_API_KEY=sk-ant-...`

### File: `app/layout.tsx`
- Metadata: title from skill, description from skill MD frontmatter, `robots: { index: false, follow: false }` (these are usually private demos).
- Google Fonts preconnect + Fraunces + Inter (or matched fonts from chosen style).
- Imports `./globals.css`.

### File: `app/page.tsx`
```tsx
import Chat from "@/components/Chat";
export default function Home() { return <Chat />; }
```

### File: `app/globals.css`
Generate from the chosen style. Variables for bg/ink/accent, two-bubble chat layout (user right-aligned with bg, assistant left-aligned with serif and accent left-border), sticky composer, restart/download buttons, mobile breakpoint at 600px. Mirror shameless-vision-site's globals.css structure.

### File: `app/api/chat/route.ts`
Server route handler — Node runtime, force-dynamic. Validates `messages` array of `{role, content}`, reads `process.env.ANTHROPIC_API_KEY`, builds an `Anthropic` SDK client, calls `client.messages.stream()` with `model: "claude-opus-4-7"`, `max_tokens: 8192`, system prompt array with `cache_control: { type: "ephemeral" }`. Returns a `ReadableStream` of text deltas via `messageStream.on("text", delta => controller.enqueue(...))`. On error, encode `[stream error: ...]` and close. Mirror `shameless-vision-site/app/api/chat/route.ts`.

### File: `components/Chat.tsx`
Client component. Mirror shameless-vision-site's Chat.tsx exactly — only swap copy on the welcome screen (eyebrow, h1, lede, footnote) to match the new skill. Keep:
- localStorage key `[skill-name]-session-v1` (rename per skill)
- Welcome → kickoff → streaming → restart → download as markdown
- AbortController for in-flight requests
- Cmd/Ctrl+Enter send
- Streaming caret indicator while reading from `/api/chat`
- Hydration guard before reading localStorage

### File: `lib/system-prompt.ts`

This is the most important transformation. Take the source skill MD content and adapt for browser:

1. **Strip** any section that uses tools the model can't access in a browser:
   - "Platform Detection" / "Claude Code enhanced path" / filesystem session JSON paths
   - Google Doc Builder routing
   - Bash / Write / Edit / mcp__* tool calls
   - File-based progress tracking

2. **Replace with portable web mode preamble:**
   > *"## Environment*
   > *You are running inside a web browser. No filesystem. No Google Doc tooling. Use the portable path: print a progress block every N completed phases, and at the end render the completed output as markdown directly in chat. The browser application persists conversation state in localStorage on the user's device."*

3. **Preserve verbatim** all skill content the original skill marked as verbatim (workbook prompts, exact scripts, framings, examples). Fidelity to the creator wins over compression.

4. **Replace** "AskUserQuestion" calls with plain-text questions ("Yes/No?" or numbered options) since the model can't call AskUserQuestion from the API.

5. **Output:** export as `export const SYSTEM_PROMPT = "...";` — wrap in template literal, escape any backticks in the content.

Show the user the diff before writing — at least the platform-detection section that was stripped and the portable-path replacement. They may want to keep something.

### Verify build

After writing all files:
```bash
cd ~/.claude/projects/[skill-name]-site && npm install && npm run build
```

Expect: ✓ Compiled successfully. 4 routes (`/`, `/_not-found`, `/api/chat`). If TypeScript errors fire, fix them before deploying.

## Phase 4 — Hosting

`AskUserQuestion`:

> *"Where should it run?"*

- **Local only** — `npm run dev`. Fastest. For screenshare or quick testing. Skip Vercel entirely.
- **Vercel deploy (Recommended)** — public URL <your-name> can send the skill's audience.
- **Static export** — declined. The API route requires server runtime; static won't work.

If Local: print the dev command, the localhost URL, and how to set `ANTHROPIC_API_KEY` in the local `.env.local`. Done.

If Vercel, continue to Phase 5.

## Phase 5 — Vercel deploy (only if chosen above)

Confirm via `AskUserQuestion` before each external action.

### 5a. Auth check
Run `vercel whoami` (PowerShell preferred to avoid Git Bash env-dump pollution). If not logged in, instruct: *"Run `! vercel login` to authenticate."* Wait for confirmation.

### 5b. Link
```powershell
Set-Location '~/.claude\projects\[skill-name]-site'
vercel link --yes
```
Creates `.vercel/project.json`. Reversible.

### 5c. Set ANTHROPIC_API_KEY (secret-safe)

**CRITICAL — never let the value enter chat.** Pipe directly from file via stdin:

```bash
sed -n 's/^ANTHROPIC_API_KEY=//p' "/c/Users/<your-username>/.claude/projects/aftercare/.env.local" \
  | head -1 | tr -d "\"'" | tr -d '\n' \
  | (cd "/c/Users/<your-username>/.claude/projects/[skill-name]-site" \
      && vercel env add ANTHROPIC_API_KEY production --yes 2>&1) \
  | grep -v "^declare -x" | tail -10
```

Expected output: `Added Environment Variable ANTHROPIC_API_KEY to Project [skill-name]-site`. If the user wants preview/development envs too, run twice more swapping `production` → `preview` → `development`.

If the source `.env.local` doesn't exist or doesn't have `ANTHROPIC_API_KEY=`, fall back: ask user to set it via the Vercel dashboard (`https://vercel.com/<your-vercel-team>/[skill-name]-site/settings/environment-variables`) and confirm before continuing.

### 5d. Deploy

```powershell
Set-Location '~/.claude\projects\[skill-name]-site'
vercel deploy --prod --yes
```

Capture the production URL from the JSON output (`deployment.url`) and the aliased URL from the `Aliased:` line.

### 5e. Post-deploy verification

Run two checks before declaring done:

**Homepage 200:**
```powershell
$r = Invoke-WebRequest -Uri 'https://[skill-name]-site.vercel.app' -UseBasicParsing
Write-Host "Status: $($r.StatusCode), CT: $($r.Headers['Content-Type'])"
```
Expect 200, content-type `text/html`. If 401 or HTML containing "Vercel SSO", deployment protection is on — instruct user to disable it at `https://vercel.com/<your-vercel-team>/[skill-name]-site/settings/deployment-protection`.

**API stream sanity:**
POST to `/api/chat` with `{messages: [{role: "user", content: "Begin."}]}`, read first ~300 chars, confirm a real text stream comes back (not a 500 error or HTML error page). If it returns 500 with "ANTHROPIC_API_KEY is not set", the env var didn't propagate — redeploy or recheck step 5c.

Report both URLs (clean alias + deploy-specific) to the user. Suggest the next steps:
- Open in browser, click through the welcome flow
- If satisfied, run `/savepoint:savepoint`
- If they want preview/dev env vars set, offer to run those now

## Things to remember

- **Never put the API key on a command line** (`--value $KEY`) — use stdin pipe. Process listings can leak.
- **Don't echo intermediate values** while building. The bash `pre-bash-dispatcher` hook on this machine prints env on every command — switching to PowerShell avoids context pollution.
- **`!`-prefix commands run non-interactively** — Vercel CLI prompts won't work through them. Use stdin pipes or have the user open a separate terminal.
- **Personal Vercel accounts** sometimes default deployments to SSO-protected. The clean URL `[skill-name]-site.vercel.app` may work but the per-deploy URL may need protection disabled. Test both.
- **Personal data privacy:** The user's API key + their conversation transcripts pass through the deployed app. localStorage keeps state on the audience's device — but the API request body lands in Vercel logs by default. Mention this to <your-name> if the skill handles sensitive content (testimonial-titrator, charisma-codes, etc.) so he can decide whether to redeploy with logging disabled.
- **Cost shape:** A typical adapted skill prompt is 5-15k tokens. With `cache_control: ephemeral` on the system block, after the first request each turn reads the system prompt at ~0.1× cost. Mention this so the user has expectations on per-session cost.
- **The user's "Restart" button** on the deployed site clears localStorage on that device only. There's no server-side state.

## Closing

After deploy + verification:

> *"Live at: https://[skill-name]-site.vercel.app*
> *Tested: homepage 200, /api/chat streaming OK.*
> *Ready to show your audience. Want me to also: (a) git init this site folder, (b) set preview/dev env vars, (c) run /savepoint?"*
