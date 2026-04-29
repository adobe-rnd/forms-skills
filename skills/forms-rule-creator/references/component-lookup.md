# Component Lookup from treeJson

## What is treeJson?

`treeJson` is the scope tree produced by `content-model-to-tree.bundle.js` from the AEM Sites Content API content model. It is a hierarchical structure with each node having:

```json
{
  "id": "$form.textfield1",
  "name": "textfield1",
  "displayName": "Full Name",
  "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
  "fieldType": "text-input",
  "path": "",
  "items": [...]
}
```

> **Note:** `path` is always `""` when built from a content model (the Sites Content API does not expose JCR paths). Use `id` for all component references.

## Resolving a Component from treeJson

Given the `treeJson` object from `content-model-to-tree.bundle.js`, find the component the user is referring to by:

1. **Match by `displayName`** (case-insensitive) — most common, from `jcr:title`
2. **Match by `name`** — the field's programmatic name

Once found, use `node.id` as the component ID in COMPONENT nodes.

## Building a COMPONENT Node

```json
{
  "nodeName": "COMPONENT",
  "value": {
    "id": "$form.textfield1"
  }
}
```

Only `id` is required. Do NOT include `type` or `name` — they are not used by the transformer.

## Flat Search Across All Levels

The tree is hierarchical. Panels contain fields. To find any component:

```
treeJson → items[] → items[] → ...
```

Walk all `items` arrays recursively. Each node with a non-`$form` `id` is a referenceable component.

## Example: Find "Email Address" field

```
treeJson.items
  → find node where displayName.toLowerCase() === 'email address'
  → found: { id: "$form.emailAddress", type: "AFCOMPONENT|FIELD|TEXT FIELD|STRING", ... }
  → use id: "$form.emailAddress"
```

## Type Tokens

The `type` field uses `|`-separated tokens. Common patterns:

| fieldType | type |
|-----------|------|
| text-input (string) | `AFCOMPONENT|FIELD|TEXT FIELD|STRING` |
| number-input | `AFCOMPONENT|FIELD|NUMBER FIELD|NUMBER` |
| date-input | `AFCOMPONENT|FIELD|DATE FIELD|DATE` |
| drop-down | `AFCOMPONENT|FIELD|DROPDOWN|STRING` |
| radio-group | `AFCOMPONENT|FIELD|RADIO BUTTON|STRING` |
| checkbox | `AFCOMPONENT|FIELD` |
| button | `AFCOMPONENT|FIELD|BUTTON` |
| panel | `AFCOMPONENT|PANEL|OBJECT` |
| form | `FORM` |
