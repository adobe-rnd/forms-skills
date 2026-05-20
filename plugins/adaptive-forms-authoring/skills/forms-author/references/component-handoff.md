# COMPONENT HANDOFF

Structured block used by `forms-author` to delegate component building to `forms-content-modeler`.

## build mode — new components

```
COMPONENT HANDOFF
─────────────────
mode:          build
definition:    /tmp/definition.json
content-model: /tmp/content-model.json
fields:
  - intent: "<natural language field description>"
  - intent: "<natural language field description>"
```

When adding panels with children, use `id` and `parent` to express nesting explicitly — positional ordering alone is ambiguous:

```
COMPONENT HANDOFF
─────────────────
mode:          build
definition:    /tmp/definition.json
content-model: /tmp/content-model.json
fields:
  - intent: "Panel: Your Details"
    id:     your_details
  - intent: "Text input: Full Name, required"
    parent: your_details
  - intent: "Email input: Email Address, required"
    parent: your_details
  - intent: "Panel: Address"
    id:     address
  - intent: "Text input: Street, required"
    parent: address
```

`forms-content-modeler` uses `parent` to group children under the named panel and returns a nested component array:

```json
[
  {
    "value": { "id": "<panel-name>", "componentType": "<resourceType>", "properties": { ... }, "items": [] },
    "children": [
      { "value": { "id": "<child-name>", "componentType": "<resourceType>", "properties": { ... } }, "children": [] },
      { "value": { "id": "<child-name>", "componentType": "<resourceType>", "properties": { ... } }, "children": [] }
    ]
  },
  {
    "value": { "id": "<panel-name>", "componentType": "<resourceType>", "properties": { ... }, "items": [] },
    "children": [
      { "value": { "id": "<child-name>", "componentType": "<resourceType>", "properties": { ... } }, "children": [] }
    ]
  }
]
```

Panel `value` objects always include `"items": []` — `build-insert-ops` derives child paths as `/items/<index>` and will fail if that property is absent.

Pass this nested array to `build-insert-ops` (see `references/workflows/add-field.md`) to produce patch ops without manual path calculation.

## update mode — edit existing component

```
COMPONENT HANDOFF
─────────────────
mode:          update
definition:    /tmp/definition.json
content-model: /tmp/content-model.json
existing:      <existing component JSON from find-field output>
intent:        "<edit description e.g. make required, change placeholder to 'Enter email'>"
```

## Preparing files before emitting the handoff

Use Bash to write MCP responses to temp files — the Write tool requires a prior Read on the path and fails for new `/tmp` files:

```bash
# Write content model (the JSON object from get-aem-page-content)
cat > /tmp/content-model.json << 'HEREDOC'
<CONTENT_MODEL JSON>
HEREDOC

# Write definition — get-aem-page-content-definition returns a text-prefixed response:
#   Page Content Definition:
#   ETag: "..."
#   {"componentDefinitions":[...]}
# Scripts require pure JSON. Strip the prefix by writing only the JSON part (starting from '{'):
cat > /tmp/definition.json << 'HEREDOC'
<DEFINITION JSON — the raw JSON object starting with '{', not the full MCP response>
HEREDOC
```

## Receiving the response

`forms-content-modeler` returns a validated component array. Proceed to the workflow step that follows the handoff.
