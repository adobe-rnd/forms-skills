# Create Form Workflow

Assumes the template page was identified and confirmed in Step 1 (page resolution). If the template page was not found — STOP. Do not proceed.

1. Call `copy-aem-page(sourcePageId: "<templatePageId>", title: "<Title>", name: "<slug>")` → new page
2. Set PAGE_ID from the new page response
3. Confirm: *"Created form at `<path>`."*
4. Run Add Field(s) workflow — see `references/workflows/add-field.md`. Use the field intents confirmed by the user in Step 2 of the skill (the proposal phase) as the `intent:` entries in the COMPONENT HANDOFF. If no fields were specified, skip this step.
5. Run Form Metadata workflow — see `references/workflows/form-metadata.md`.
