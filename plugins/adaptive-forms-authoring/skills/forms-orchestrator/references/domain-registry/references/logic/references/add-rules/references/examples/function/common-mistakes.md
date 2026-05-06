# FUNCTION_CALL — Common Mistakes

These errors cause `rule-save` to fail with cryptic messages like `"getChoiceModel is not a function"`. Use this reference to diagnose and fix them.

## Quick Reference

| Mistake | What happens | Fix |
|---------|-------------|-----|
| **Missing `choice` wrapper on params** | Param becomes a `TerminalModel` instead of `ChoiceModel`, crashes the transformer | Every param MUST be `{ "nodeName": "EXPRESSION", "choice": { ... } }` — never put `value` directly on the param |
| **Missing `description` in args** | Validation fails during preprocessing | Every arg needs all 4 fields: `{ "type", "name", "description", "isMandatory" }` |
| **Missing `isMandatory` in args** | Validation fails during preprocessing | Set `"isMandatory": true` (or `false` for optional params) on every arg |
| **Wrong `displayPath` format** | Component lookup fails | Format is `"FORM/panelName/"` — traces from form root to the component's parent panel. Use `""` for functions |
| **Missing `impl` in functionName** | Transform produces no output | Use positional pattern: `"$0($1, $2)"` for 2-param function |
| **`params` count ≠ `args` count** | Validation rejects the rule | `params` array must have exactly one entry per `args` entry |
| **Param without `nodeName`** | Model factory can't determine type | Every param needs `"nodeName": "EXPRESSION"` |
| **Missing `displayPath` on functionName** | Inconsistent behavior | For custom/OOTB functions, set `"displayPath": ""` (empty string) |
| **COMPONENT value missing fields** | Crash during type filtering or transform | Every COMPONENT value needs: `id`, `displayName`, `type`, `isDuplicate`, `displayPath`, `name`, `parent`, `metadata` |

---

## 1. Param missing `choice` wrapper

This is the **#1 cause** of the `getChoiceModel is not a function` crash.

### ❌ Wrong

```json
{
  "nodeName": "EXPRESSION",
  "value": { "id": "$form.panel.field", "name": "field", "type": "STRING" }
}
```

The model factory sees `value` → creates a `TerminalModel` → which has no `getChoiceModel()` method → crash.

### ✅ Correct

```json
{
  "nodeName": "EXPRESSION",
  "choice": {
    "nodeName": "COMPONENT",
    "value": {
      "id": "$form.panel.field",
      "displayName": "field",
      "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
      "isDuplicate": false,
      "displayPath": "FORM/panel/",
      "name": "field",
      "parent": "$form.panel",
      "metadata": {}
    }
  }
}
```

The `choice` wrapper tells the model factory to create a `ChoiceModel`, which has the `getChoiceModel()` method the transformer expects.

---

## 2. Args missing `description` and `isMandatory`

### ❌ Wrong

```json
"args": [
  { "type": "STRING", "name": "custId" }
]
```

### ✅ Correct

```json
"args": [
  { "type": "STRING", "name": "custId", "description": "Customer ID", "isMandatory": true }
]
```

Every entry in `functionName.args` requires all four fields. The `preprocessFunctionCallTypes` validation checks for this and will reject the rule with a clear error if any are missing.

---

## 3. Wrong `displayPath` format

### ❌ Wrong

```json
{
  "id": "$form.personalInfo.firstName",
  "displayName": "firstName",
  "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
  "displayPath": "personalInfo",
  "name": "firstName",
  "parent": "$form.personalInfo"
}
```

### ✅ Correct

```json
{
  "id": "$form.personalInfo.firstName",
  "displayName": "firstName",
  "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
  "isDuplicate": false,
  "displayPath": "FORM/personalInfo/",
  "name": "firstName",
  "parent": "$form.personalInfo",
  "metadata": {}
}
```

`displayPath` format: `"FORM/<panel1>/<panel2>/"` — starts with `FORM`, includes each ancestor panel, ends with `/`. For the form root itself, use `"FORM/"`. For function names (not components), use `""`.

---

## 4. Missing or wrong `impl` pattern

### ❌ Wrong

```json
"functionName": {
  "id": "calculateTotal",
  "displayName": "Calculate Total",
  "type": "NUMBER",
  "args": [
    { "type": "NUMBER", "name": "price", "description": "Item price", "isMandatory": true },
    { "type": "NUMBER", "name": "qty", "description": "Quantity", "isMandatory": true }
  ]
}
```

Missing `impl` — the transformer won't know how to compose the function call.

### ✅ Correct

```json
"functionName": {
  "id": "calculateTotal",
  "displayName": "Calculate Total",
  "type": "NUMBER",
  "isDuplicate": false,
  "displayPath": "",
  "args": [
    { "type": "NUMBER", "name": "price", "description": "Item price", "isMandatory": true },
    { "type": "NUMBER", "name": "qty", "description": "Quantity", "isMandatory": true }
  ],
  "impl": "$0($1, $2)"
}
```

`impl` rules:
- `$0` = function name (replaced by `functionName.id`)
- `$1`, `$2`, ... = parameters in order
- 0 params: `"$0()"`
- 1 param: `"$0($1)"`
- 2 params: `"$0($1, $2)"`
- 3 params: `"$0($1, $2, $3)"`

---

## 5. Literal value params — wrong wrapper

### ❌ Wrong

```json
{
  "nodeName": "EXPRESSION",
  "choice": {
    "nodeName": "STRING_LITERAL",
    "choice": "Hello"
  }
}
```

Literals use `value`, not `choice`, inside the inner node.

### ✅ Correct

```json
{
  "nodeName": "EXPRESSION",
  "choice": {
    "nodeName": "STRING_LITERAL",
    "value": "Hello"
  }
}
```

The outer param always has `choice`. The inner literal node has `value`. Don't confuse the two levels.

---

## 6. Params count mismatch

### ❌ Wrong — function declares 2 args but provides 1 param

```json
"functionName": {
  "id": "concat",
  "args": [
    { "type": "STRING", "name": "a", "description": "First", "isMandatory": true },
    { "type": "STRING", "name": "b", "description": "Second", "isMandatory": true }
  ],
  "impl": "$0($1, $2)"
},
"params": [
  { "nodeName": "EXPRESSION", "choice": { "nodeName": "STRING_LITERAL", "value": "hello" } }
]
```

### ✅ Correct — params count matches args count

```json
"params": [
  { "nodeName": "EXPRESSION", "choice": { "nodeName": "STRING_LITERAL", "value": "hello" } },
  { "nodeName": "EXPRESSION", "choice": { "nodeName": "STRING_LITERAL", "value": " world" } }
]
```

---

## 7. COMPONENT value missing required fields

### ❌ Wrong — minimal component

```json
{
  "nodeName": "COMPONENT",
  "value": {
    "id": "$form.panel.field",
    "name": "field"
  }
}
```

### ✅ Correct — complete component

```json
{
  "nodeName": "COMPONENT",
  "value": {
    "id": "$form.panel.field",
    "displayName": "field",
    "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
    "isDuplicate": false,
    "displayPath": "FORM/panel/",
    "name": "field",
    "parent": "$form.panel",
    "metadata": {}
  }
}
```

All 8 fields are required: `id`, `displayName`, `type`, `isDuplicate`, `displayPath`, `name`, `parent`, `metadata`.

---

## Debugging Tips

1. **Run with DEBUG=true** to get stack traces:
   ```
   DEBUG=true rule-save <rule.json> --rule-store <form>.rule.json --form <form>.form.json
   ```

2. **Validate first** — always run `rule-validate` before `rule-save`. It catches structural issues earlier.

3. **Check the grammar** — use `rule-grammar | jq '.FUNCTION_CALL'` to see the expected node structure.

4. **Compare with working examples** — see [api-call/rule.json](api-call/rule.json) and [calculation/rule.json](calculation/rule.json) for known-good FUNCTION_CALL structures.