# Create Form Workflow

Assumes the template page was identified and confirmed in Step 1 (page resolution). If the template page was not found — STOP. Do not proceed.

1. Call `copy-aem-page(sourcePageId: "<templatePageId>", title: "<Title>", name: "<slug>")` → new page
2. Set PAGE_ID from the new page response
3. Confirm: *"Created form at `<path>`."*
4. Run Add Field(s) workflow — see `references/workflows/add-field.md`
5. Run Form Metadata workflow — see `references/workflows/form-metadata.md`
