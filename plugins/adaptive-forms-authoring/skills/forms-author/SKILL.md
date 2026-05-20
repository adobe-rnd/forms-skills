---
name: forms-author
description: "All AEM Adaptive Forms content operations via the Sites Content MCP API. Orchestrates component building (via forms-content-modeler) and rule generation (via forms-rule-author). Invoke directly for any form operation. Triggers: create form, add field, add panel, add fragment, change property, delete field, move field, set required, rename, add options, set submit action, prefill, schema, apply rule, when, if, show/hide rule, validate rule, calculate."
---

# forms-author

Orchestrates AEM Adaptive Forms content operations. Delegates component building to `forms-content-modeler` and rule generation to `forms-rule-author`.

---

## MCP Check

Verify Sites Content MCP tools are available (e.g. `get-aem-sites`). If not, stop and show:

```
The forms-author skill requires the Sites Content MCP server.

Local AEM (localhost:4502):
  claude mcp add aem-sites-content -- node /tmp/aem-sites-contentapi-mcp-server/build/index.js
  Env: AEM_AUTHOR_URL=http://localhost:4502  AEM_AUTHOR_AUTH_PARAMETER=admin:admin

AEM as a Cloud Service:
  claude mcp add --transport http aem-sites-content https://mcp.adobeaemcloud.com/adobe/mcp/content

Restart Claude Code after adding the MCP server.
```

---

## Step 1 — Page Resolution (MANDATORY)

Load `references/page-resolution.md`. Do not proceed until:
- The form page is identified and confirmed by the user
- For **create form**: search for templates via MCP first (see page-resolution.md Step B); only ask the user if no templates are found via MCP. Do not guess or infer template paths.

---

## Step 2 — Plan and propose

Before loading any workflow or executing:

1. Identify what operations are needed
2. Show a concrete proposal and wait for confirmation:

   > "I'll make the following changes to `<form path>`:
   > - Add: `full_name` (text), `email` (email)
   > - Edit: `phone` → required
   > - Delete: `old_field`
   >
   > Proceed?"

3. Once confirmed — identify which references are needed and load only those

---

## Step 3 — Load references and execute

Load only the references required for the confirmed task:

| Operation | Load |
|---|---|
| Add field(s) | `references/workflows/add-field.md` |
| Edit a field property | `references/workflows/edit-field.md` |
| Delete a field | `references/workflows/delete-field.md` |
| Rename a field | `references/workflows/rename-field.md` |
| Move or reorder a field | `references/workflows/move-reorder.md` |
| Create a new form | `references/workflows/create-form.md` + `references/workflows/form-metadata.md` |
| Update form title, description, submit action, prefill, schema | `references/workflows/form-metadata.md` |
| Apply a rule | `references/apply-rule-workflow.md` |
| Add field(s) + rule | `references/workflows/add-field.md` + `references/apply-rule-workflow.md` |

---

## Delegation Rules

- Component shape needed → emit COMPONENT HANDOFF to `forms-content-modeler` (see `references/component-handoff.md`)
- Rule needed → emit RULE HANDOFF to `forms-rule-author`
- Everything else → handle directly via scripts + MCP
