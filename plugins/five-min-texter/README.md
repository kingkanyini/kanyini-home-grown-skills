# five-min-texter

**Never miss a vulnerable first contact.** When someone new texts your practice, they get a warm,
in-your-voice reply — with your thumb on every send while the system earns your trust. Built for the
solo **wellness / coaching practitioner** who can't watch their phone all day but never wants a person
reaching out to land in silence.

```
/five-min-texter
```

> ⚠️ **Not a crisis service. Not a clinical instrument.** This tool screens inbound texts for crisis
> language with a best-effort keyword + LLM filter and instantly hands anyone in distress the
> **988 / 741741 / 911** copy before anything else runs. It is **not a substitute for emergency
> services or professional care**, it can miss signals, and **you are responsible for your deployment.**
> The crisis screen is the deterministic default in the workflow and the wizard never offers to remove
> it. Provided **as-is** under the marketplace LICENSE. The setup wizard requires you to read and
> acknowledge the crisis copy before it will proceed.

---

## What it does

`/five-min-texter` is a one-time setup wizard that stands up a complete SMS auto-responder you own:

1. **Intake interview** (Job A) — a guided, counsel-flavored interview captures *your* voice, FAQ scope,
   crisis copy, hours, and where you want automation to go over time. It writes those into a pre-built,
   council-reviewed engine.
2. **Setup walkthrough** (Job B) — a hand-held, best-practice walkthrough to stand up n8n Cloud +
   Twilio + A2P 10DLC, import the workflow, test it on a shadow ladder, and go live in
   **draft-and-approve** mode (you approve every reply).

The job it does: a new inquiry gets an **instant acknowledgment** within seconds, and a **warm reply in
your voice within ~5 minutes** — held in Telegram for your one-tap approval. A deterministic crisis
screen runs first and routes anyone in distress to real help. Nobody gets ghosted; nothing sends
without you in v1.

## What's in the box

- `commands/five-min-texter.md` — the wizard flow (intake → setup → handoff).
- `references/` — the intake question bank, the setup walkthrough, the counsel voices, and the
  non-negotiables.
- `engine/` — the pre-built engine: the validated n8n workflow + error workflow, the bot-brain and
  classifier prompts, the crisis/auto-ack copy, the FAQ + spine docs, and the standalone config check.
- `config.template.json` — the 1:1 config contract; the wizard fills a local `config.json` from your
  answers (your filled config stays on your machine and is never committed).
- `examples/` — an anonymized handoff brief you can adapt.

## Two ways updates reach you (read this)

This plugin updates through the marketplace, but the thing actually answering texts day-to-day is the
**n8n workflow running in your own n8n Cloud account** — those are two surfaces:

| What changed | How the update reaches you |
|---|---|
| The wizard (intake/setup) | `claude plugin update five-min-texter` |
| The engine / workflow logic (incl. a security fix) | The update ships you a new `engine/workflow.n8n.json` — you **re-import it into your n8n** to apply. `claude plugin update` does **not** patch a workflow already running in your cloud. |

So after a meaningful engine update, re-import the workflow. The wizard will tell you when that matters.

## Safety & scope

- **Draft-and-approve only in v1.** Nothing sends to a prospect without your explicit approval. The
  wizard produces an `automation-roadmap.md` that plans graduation to more autonomy *as it proves out* —
  you graduate it; it never graduates itself, and a first emotional contact is never auto-sent by default.
- **Mindful handling.** Drafts never echo or guess a person's specific situation; a clinical-language
  guard and a numbers-must-match-your-FAQ guard run on every draft.
- **Crisis handling.** The deterministic screen + the canned 988 copy run before the reply brain ever
  sees a message, and the AI exits a crisis conversation; a later message from that number gets the
  standard acknowledgment and a draft held for your approval (it isn't frozen out forever).
- **Your secrets live in n8n's credential vault** — never in this folder or in chat.

## Install

This plugin is distributed through the **Kanyini Home-Grown Skills** marketplace. Add the marketplace,
install, restart, then run `/five-min-texter` from the plugin root. Going **live** depends on carrier
approval (A2P 10DLC) — usually a few days to a week, out of anyone's hands; the wizard files it first so
it bakes while you build.

Questions: kingkanyini@gmail.com
