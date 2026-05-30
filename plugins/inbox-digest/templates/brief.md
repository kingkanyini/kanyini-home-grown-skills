---
type: client-brief
client: "{{client_slug}}"
date: "{{date}}"
threads_scanned: {{threads_scanned}}
new_threads: {{new_threads}}
new_messages: {{new_messages}}
attachments_pulled: {{attachments_pulled}}
action_items_added: {{action_items_added}}
inferred_action_items: {{inferred_count}}
---

# {{client_display_name}} — {{date}}

{{#if heartbeat_warning}}
> ⚠️ **Heartbeat warning:** {{heartbeat_message}}

{{/if}}
## ⚡ TODAY'S 3 MOVES

> The 3 highest-priority next actions from this scan. Open the full brief below if you need context.

{{#each top_3_moves}}
{{rank}}. **{{action}}**
   - Why: {{reason}}{{#if inferred}} *(inferred)*{{/if}}
   - Source: <your-related-note>{{#if source_quote}} — "{{source_quote}}"{{/if}}
   - Owner: {{owner}} | Due: {{due}}

{{/each}}

---

> Items marked *(inferred)* lacked a verifiable source quote — verify before acting.

<details>
<summary>Full brief (click to expand)</summary>

## TL;DR

{{#each tldr_bullets}}
- {{this}}
{{/each}}

## Key Points by Sender

{{#each sender_groups}}
### {{sender_name}}
{{#each points}}
- {{this}}
{{/each}}

{{/each}}

## Attachments Referenced

{{#each attachments}}
- **{{filename}}** (<your-related-note>){{#if extracted}} — <your-related-note>{{/if}}
  {{summary}}
{{/each}}

## Full Action Queue (added this scan)

{{#each action_items}}
- [ ] **{{action}}** — owner: {{owner}}, due: {{due}}
  Source: <your-related-note>{{#if source_quote}} — "{{source_quote}}"{{/if}}{{#if inferred}} *(inferred)*{{/if}}
{{/each}}

## New Threads This Scan

{{#each thread_links}}
- <your-related-note> — {{subject_safe}}
{{/each}}

</details>
