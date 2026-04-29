# CALC_EXPRESSION and CLEAR_EXPRESSION Grammar

Used for `fd:calc` (Calculate event). CALC_EXPRESSION sets a value; CLEAR_EXPRESSION clears it.

---

## CALC_EXPRESSION

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "CALC_EXPRESSION",
      "items": [
        { "nodeName": "VALUE_FIELD", "value": { "id": "$form.totalField" } },
        { "nodeName": "Using", "value": null },
        { "nodeName": "Expression", "value": null },
        {
          "nodeName": "EXPRESSION",
          "choice": { ... }
        }
      ]
    }
  }],
  "enabled": true,
  "isValid": true
}
```

The sequence is always: `VALUE_FIELD`, `Using`, `Expression`, `EXPRESSION`.

`Using` and `Expression` are keyword/label nodes with `value: null`.

> **No conditional support in CALC_EXPRESSION.** The grammar does not include `When`/`CONDITIONORALWAYS` nodes.
> For "set value when condition", use **EVENT_SCRIPTS** on the trigger field's `fd:change` event —
> `EQUALS_TO` in `EVENT_AND_COMPARISON_OPERATOR`, then `SET_VALUE_STATEMENT` in `BLOCK_STATEMENTS`.

---

## EXPRESSION Choices

```json
// String literal
{ "nodeName": "STRING_LITERAL", "value": "hello" }

// Number literal
{ "nodeName": "NUMERIC_LITERAL", "value": 42 }

// Boolean literal — BOOLEAN_LITERAL is a choice between True/False nodes
{ "nodeName": "True" }
{ "nodeName": "False" }

// Another field's value
{ "nodeName": "COMPONENT", "value": { "id": "$form.field1" } }

// Field property
{
  "nodeName": "MEMBER_EXPRESSION",
  "items": [
    { "nodeName": "PROPERTY_LIST", "value": "value" },
    { "nodeName": "of", "value": null },
    { "nodeName": "COMPONENT", "value": { "id": "$form.field1" } }
  ]
}

// Function call
{
  "nodeName": "FUNCTION_CALL",
  "functionName": { "id": "sum", "impl": "$0($1, $2)" },
  "params": [
    { "nodeName": "COMPONENT", "value": { "id": "$form.field1" } },
    { "nodeName": "COMPONENT", "value": { "id": "$form.field2" } }
  ]
}
```

For OOTB function `id` and `impl` values, see `agent-kb/08-ootb-functions-reference.md`. For json-formula expression syntax, see `agent-kb/07-json-formula-for-rules.md`.

---

## CLEAR_EXPRESSION

Sequence: `VALUE_FIELD When CONDITIONORALWAYS`. Use `CONDITIONORALWAYS.choice: null` to always clear.

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "CLEAR_EXPRESSION",
      "items": [
        { "nodeName": "VALUE_FIELD", "value": { "id": "$form.totalField" } },
        { "nodeName": "When", "value": null },
        { "nodeName": "CONDITIONORALWAYS", "choice": null }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```

---

## Example: Calculate total = field1 + field2

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "CALC_EXPRESSION",
      "items": [
        { "nodeName": "VALUE_FIELD", "value": { "id": "$form.totalField" } },
        { "nodeName": "Using", "value": null },
        { "nodeName": "Expression", "value": null },
        {
          "nodeName": "EXPRESSION",
          "choice": {
            "nodeName": "FUNCTION_CALL",
            "functionName": { "id": "sum", "impl": "$0($1, $2)" },
            "params": [
              { "nodeName": "COMPONENT", "value": { "id": "$form.field1" } },
              { "nodeName": "COMPONENT", "value": { "id": "$form.field2" } }
            ]
          }
        }
      ]
    }
  }],
  "enabled": true,
  "isValid": true
}
```
