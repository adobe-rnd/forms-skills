---
name: forms-content-modeler
description: >
  Use when building or validating AEM Adaptive Forms component JSON from field
  intents and a content model. Typically invoked by forms-author; use directly
  only when building or validating a component payload in isolation.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
  type: skill
  triggers:
    - build component
    - model field
    - validate component
    - resolve field type
    - check name collision
---

# forms-content-modeler

Produces validated component JSON from a definition + content model.

## Inputs

| Input | Description |
|---|---|
| Definition | Component definition JSON from `get-aem-page-content-definition` |
| Content model | Current form structure JSON from `get-aem-page-content` |
| Field intents | Natural language description(s) of the field(s) to build or edit |

## Workflow — build mode

For each field intent (in order):

1. Map intent to `fieldType` via `references/field-types.md`
2. Run `resolve-component-type` → `candidates` array. If one candidate, use it. If multiple, pick the candidate whose `title` best matches user intent (guided by the Notes column in `field-types.md`).
3. Run `filter-definition` → slim definition for this component only
4. Run `get-component-def` → property profile (`fields`, `requiredKeys`)
5. Build properties — set `requiredKeys` + user-specified properties only. AEM conventions:
   - `name`: snake_case from intent. Required for all components with a `fieldType`.
   - `id`: same as `name`.
   - `dorColspan`: `12` (number).
   - `componentType`: use `normalized` from the chosen candidate — never construct manually.
   - Load `references/field-quirks.md` for: textinput, telephoneinput, numberinput, datepicker, dropdown, checkbox, switch, fileinput, panelcontainer.
6. Run `validate-add`
7. After processing all fields: run `check-name-collision` once for all proposed names — if any collision, derive alternate (`<name>_1`) and re-check

## Workflow — update mode

Invoked when forms-author delegates an edit operation via COMPONENT HANDOFF.

1. `componentType` is known from the existing component — skip fieldType mapping
2. Run `filter-definition` + `get-component-def` → property profile
3. Apply edit intent to existing properties. Apply AEM conventions to changed properties only.
4. Run `validate-add` on updated component
5. Run `check-name-collision` if name changed

## Scripts

```bash
# Resolve fieldType → candidates (pick best by title)
node $SKILL_DIR/scripts/resolve-component-type.bundle.js \
  --definition-file <path> --field-type <fieldType>
# Output: { candidates: [{ componentType, normalized, title }, ...] }

# Slim definition to one component type
node $SKILL_DIR/scripts/filter-definition.bundle.js \
  --definition-file <path> --component-types <componentType>
# Output: { componentDefinitions: [...], placementRules: [...] }

# Extract property profile
node $SKILL_DIR/scripts/get-component-def.bundle.js \
  --definition-file <path> --component-type <componentType>
# Output: { componentType, fields: [...], requiredKeys: [...] }

# Structural validation
node $SKILL_DIR/scripts/validate-add.bundle.js \
  --definition '<slimDefinitionJson>' --component '<componentJson>'
# Output: { valid, errors }. Exit 0=valid, 1=invalid.

# Batch name collision check
node $SKILL_DIR/scripts/check-name-collision.bundle.js \
  --content-model-file <path> --names 'name1,name2,...'
# Output: { collisions: [{name, existingPath}], intraBatch: [{a,b}] }. Exit 0=none, 1=any.
```

## Output

### Flat (no `parent:` fields in COMPONENT HANDOFF)

Return a validated component array, one entry per input field intent, in the same order:

```json
[
  { "id": "<name>", "componentType": "<resourceType>", "properties": { ... } },
  { "id": "<name>", "componentType": "<resourceType>", "properties": { ... }, "items": [] }
]
```

- Output is positionally aligned with the input `fields` array — `output[i]` corresponds to `fields[i]`
- Leaf fields: omit `items`
- Empty panel: `"items": []`
- Never include `capi-key` or `capi-index`

### Nested (when `parent:` fields are present in COMPONENT HANDOFF)

When any `fields` entry carries a `parent:` key, return a **nested** array where each root entry wraps the component in a `value` key and lists its children under `children`:

```json
[
  {
    "value": { "id": "<panel-name>", "componentType": "<resourceType>", "properties": { ... }, "items": [] },
    "children": [
      { "value": { "id": "<child-name>", "componentType": "<resourceType>", "properties": { ... } }, "children": [] },
      { "value": { "id": "<child-name>", "componentType": "<resourceType>", "properties": { ... } }, "children": [] }
    ]
  }
]
```

- Only root-level items (no `parent:`) appear at the top of the array; their children are nested under `children`
- `children` is always present (empty array for leaf nodes)
- Panels that have children **must** include `"items": []` in their `value` — `build-insert-ops` addresses child nodes at `/items/<index>` and will fail if that path is missing
- The order within `children` matches the order of the corresponding `parent:` entries in the COMPONENT HANDOFF
- This format is consumed directly by `build-insert-ops.bundle.js` in the `forms-author` skill
