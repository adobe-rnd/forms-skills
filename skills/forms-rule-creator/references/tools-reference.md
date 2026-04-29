# CLI Tools Reference

All tools are pre-bundled in `$SKILL_DIR/scripts/` — no `npm install` required at runtime.
All tools write JSON to stdout and exit non-zero on failure.

---

## `content-model-to-tree.bundle.js`

Converts an AEM Sites Content API content model (`get-aem-page-content` response) to treeJson.
**Use this instead of `aemf-transform-jcr`.** No AEM credentials or extra HTTP call required.

**Input:**
```bash
node $SKILL_DIR/scripts/content-model-to-tree.bundle.js --content-model '<json>'
node $SKILL_DIR/scripts/content-model-to-tree.bundle.js --content-model-file /tmp/content-model.json
```

**Output (success):**
```json
{ "success": true, "treeJson": { "id": "$form", "items": [...] } }
```
Also writes treeJson to `/tmp/treeJson.json`.

**Output (failure):**
```json
{ "success": false, "error": "..." }
```

**Exit code:** 0 on success, 1 on failure.

---

## `validate-rule.bundle.js`

Validates a rule AST object against the grammar and scope.

**Input:**
```bash
node $SKILL_DIR/scripts/validate-rule.bundle.js <rule.json> --tree <treeJson.json> [--functions <cf.json>] [--storage-path <fd:click>]
```

- `<rule.json>` — file containing the rule AST object (`nodeName: 'ROOT'` node)
- `--tree` — treeJson file from `content-model-to-tree.bundle.js`
- `--functions` — JSON array of custom function definitions (output `.customFunction` from `parse-functions.bundle.js`)
- `--storage-path` — optional fd:* key for context validation (e.g., `fd:calc` rejects EVENT_SCRIPTS)

**Output (valid):**
```json
{ "valid": true, "errors": [], "warnings": [] }
```

**Output (invalid):**
```json
{
  "valid": false,
  "errors": [
    {
      "code": "GRAMMAR_SEQUENCE_MISMATCH",
      "path": "$.items[0].choice.items",
      "message": "...",
      "alternatives": ["COMPONENT", "to", "EXPRESSION"]
    }
  ],
  "warnings": []
}
```

**Error codes:**
- `GRAMMAR_SEQUENCE_MISMATCH` — wrong number or order of items in a sequence node
- `GRAMMAR_NODE_INVALID` — node is not an object
- `GRAMMAR_NODE_NAME_MISSING` — node lacks `nodeName`
- `GRAMMAR_MODEL_MISMATCH` — sequence node uses `choice` or vice versa
- `SEMANTIC_FUNCTION_UNKNOWN` — function not in scope; `available[]` lists known functions
- `SEMANTIC_FUNCTION_ARITY_MISMATCH` — wrong number of params
- `SEMANTIC_MEMBER_COMPONENT_UNKNOWN` — component ID not found in treeJson
- `SEMANTIC_MEMBER_PROPERTY_INVALID` — property not valid for that field type; `available[]` lists valid ones
- `CONTEXT_STATEMENT_MISMATCH` — STATEMENT type not allowed in this fd:* context

**Exit code:** 0 if valid, 1 if invalid.

---

## `generate-formula.bundle.js`

Transforms a validated rule AST to `fd:rules` + `fd:events` and validates the compiled formula.
Wraps `RuleTransformer.transform()` from `@aemforms/rule-editor-transformer`.

**Input:**
```bash
node $SKILL_DIR/scripts/generate-formula.bundle.js <rule.json> --tree <treeJson.json> [--functions <cf.json>] [--event <fd:click>]
```

- `--event` — fd:* storage key for the rule (e.g., `fd:visible`, `fd:click`, `fd:validate`)

**Output (success, single-rule AST with `nodeName`):**
```json
{
  "success": true,
  "formulaValid": true,
  "fdRules": {
    "fd:visible": {
      "content": "firstName != ''",
      "field": null,
      "event": null,
      "model": null,
      "otherEvents": null
    }
  },
  "fdEvents": {}
}
```

Extract the formula: `fdRules["fd:<key>"].content` → the expression string.

**Output (success, field input with `fd:*` keys):**
```json
{
  "success": true,
  "formulaValid": true,
  "fdRules": { "visible": "<expression>" },
  "fdEvents": { "click": ["<script>"] }
}
```

**Output (failure):**
```json
{ "success": false, "formulaValid": false, "error": "..." }
```

**Exit code:** 0 on success, 1 on failure.

---

## `parse-functions.bundle.js`

Parses a custom functions JS file into a structured array for use with validate/generate.

**Input:**
```bash
node $SKILL_DIR/scripts/parse-functions.bundle.js <functions.js>
node $SKILL_DIR/scripts/parse-functions.bundle.js --stdin
```

**Output (success):**
```json
{
  "success": true,
  "customFunction": [
    { "name": "myFn", "id": "myFn", "args": [...] }
  ],
  "imports": ["import something from './module.js';"]
}
```

**Output (failure):**
```json
{ "success": false, "error": "..." }
```

**Exit code:** 0 on success, 1 on failure.

> **Note:** `parse-functions.bundle.js` requires the `vendor/` directory from `@aemforms/rule-editor-transformer` to be present alongside the bundle at runtime. Custom function parsing is an optional step — skip if no custom functions are used.

---

## `validate-merge.bundle.js`

Validates the merged `{ fd:rules, fd:events }` object — checks that expression rules stay in `fd:rules` and event rules route to `fd:events`.

**Input:**
```bash
node $SKILL_DIR/scripts/validate-merge.bundle.js <merged-rule.json>
```

**Output (valid):**
```json
{ "valid": true, "errors": [], "warnings": [] }
```

**Output (invalid):**
```json
{ "valid": false, "errors": [...], "warnings": [] }
```

**Exit code:** 0 if valid, 1 if invalid.
