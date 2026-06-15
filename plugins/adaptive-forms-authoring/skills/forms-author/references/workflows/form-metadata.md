# Form Metadata Workflow

## Page-level (title + description + config)

Use the eTag from the most recent `get-aem-page-content` — do NOT call `get-aem-page-metadata` for a separate eTag.

> **Note:** Include `sling:configRef` only when `AEM_FORM_CONFIG_PATH` is set. Omit it otherwise — the value copied from the template page is preserved.

```json
[
  { "op": "replace", "path": "/properties/jcr:title", "value": "..." },
  { "op": "replace", "path": "/properties/jcr:description", "value": "..." },
  { "op": "replace", "path": "/properties/sling:configRef", "value": "<AEM_FORM_CONFIG_PATH>" }
]
```

Skip `validate-patch` for these ops — they are JCR properties with no definition entry.

## Form container properties (submit action, prefill, schemaRef, customStylesPath)

Find root container: depth-0 item where `properties.fieldType === "form"` → capiKey (e.g. `"0"`).

Skip `validate-patch` for guideContainer ops — it exits 1 as a false positive. Patch directly.

| User request | Property | Notes |
|---|---|---|
| Set submit action | `actionType` | See valid values below |
| Set prefill service | `prefillService` | Full service class or path |
| Bind schema | `schemaRef` | JCR path to schema node |
| On submit: redirect | `thankYouOption: "page"` + `redirect: "<url>"` | Two props together |
| On submit: show message | `thankYouOption: "message"` + `thankYouMessage: "<text>"` | Two props together |
| Set custom styles path | `customStylesPath` | Path relative to codebase root, e.g. `/blocks/form/styles/{journey}/form.css` |

`actionType` valid values:
- `"fd/af/components/guidesubmittype/restendpoint"`
- `"fd/af/components/guidesubmittype/email"`
- `"fd/af/components/guidesubmittype/storeContent"`
- `"fd/af/components/guidesubmittype/workflowSubmitAction"`
