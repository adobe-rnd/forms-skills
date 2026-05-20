# Component Lookup from treeJson

## What is treeJson?

`treeJson` is the scope tree produced by `transform-jcr` or `transform-content-model` (see tools-reference.md). It is a hierarchical structure with each node having:

```json
{
  "id": "$form.textfield1",
  "name": "textfield1",
  "displayName": "Full Name",
  "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
  "fieldType": "text-input",
  "path": "/content/forms/af/my-form/jcr:content/guideContainer/textfield1",
  "items": [...]
}
```

For `checkbox`, `checkbox-group`, `radio-group`, and `drop-down` fields that have an `enum`, the node also contains an `options` map:

```json
{
  "id": "$form.gender",
  "fieldType": "radio-group",
  "options": {
    "male": "Male",
    "female": "Female",
    "other": "Other"
  }
}
```

`options` keys are the enum values (what the field's `value` holds at runtime); `options` values are the display labels. **When writing a condition that tests a specific selection, read the valid values from `options` keys — do not guess or hardcode them.**

For `checkbox` specifically: `options` has exactly two keys — the first key is the on/checked value (`enum[0]`), the second is the off/unchecked value (`enum[1]`).

## Resolving a Component from treeJson

Use `find-field.jsh` — do not walk the tree manually.

```bash
# Single field
node $SKILL_DIR/scripts/find-field.jsh --tree /tmp/treeJson.json --name "Full Name"

# Multiple fields at once
node $SKILL_DIR/scripts/find-field.jsh --tree /tmp/treeJson.json --names "Full Name,Email Address"
```

`--name` / `--names` accepts display name, programmatic name, or qualified ID — `RBScope.findByName` resolves all three.

**Output (found — plain field):**
```json
{ "found": true, "qualifiedId": "$form.textfield1", "name": "textfield1", "displayName": "Full Name", "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING", "fieldType": "text-input", "isPanel": false }
```

**Output (found — enum field: checkbox / checkbox-group / radio-group / drop-down):**
```json
{ "found": true, "qualifiedId": "$form.gender", "name": "gender", "displayName": "Gender", "type": "AFCOMPONENT|FIELD|RADIO BUTTON|STRING", "fieldType": "radio-group", "isPanel": false, "options": { "male": "Male", "female": "Female" } }
```

`options` keys are the runtime enum values to use in condition expressions. For `checkbox`, `keys[0]` is the on/checked value and `keys[1]` is the off/unchecked value. **Use `options` keys directly — do not hardcode enum values.**

**Output (not found):**
```json
{ "found": false, "name": "Full Name" }
```

Exit code: 0 = found, 1 = not found, 2 = bad args.

## Building a COMPONENT Node

Use `qualifiedId` from the find-field result as the component ID:

```json
{
  "nodeName": "COMPONENT",
  "value": {
    "id": "$form.textfield1"
  }
}
```

Only `id` is required. Do NOT include `type` or `name` — they are not used by the transformer.
