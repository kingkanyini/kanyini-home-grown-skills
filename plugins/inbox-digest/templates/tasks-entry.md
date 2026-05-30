<!--
Initial structure of context/clients/[slug]/tasks.md if it doesn't exist (Phase 3 creates):

# Tasks — {{client_display_name}}

> Action items extracted from emails by /inbox-digest. Append-only ledger.
> Items marked *(inferred)* lacked a verifiable source quote — review before acting.
> Check items off as completed. Move stale completed items to a `## Completed` section manually.

-->

- [ ] [{{date}}] **{{action}}** — owner: {{owner}}, due: {{due}}{{#if inferred}} *(inferred)*{{/if}}
  Source: <your-related-note>{{#if source_quote}} — "{{source_quote}}"{{/if}}
  Added by /inbox-digest {{run_id}}
