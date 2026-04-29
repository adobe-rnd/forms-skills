# VALIDATE_EXPRESSION Grammar

Used for `fd:validate` (Validate event). The condition must evaluate to a boolean.

```
ROOT → STATEMENT → VALIDATE_EXPRESSION
  ├── AFCOMPONENT    (field being validated)
  ├── Using          (keyword)
  ├── Expression     (keyword)
  └── CONDITION      (COMPARISON_EXPRESSION | BOOLEAN_BINARY_EXPRESSION)
```

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "VALIDATE_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.field1" } },
        { "nodeName": "Using", "value": null },
        { "nodeName": "Expression", "value": null },
        {
          "nodeName": "CONDITION",
          "choice": { ...COMPARISON_EXPRESSION or BOOLEAN_BINARY_EXPRESSION... }
        }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```

The CONDITION uses the same nodes as `conditions.md`. See that file for COMPARISON_EXPRESSION and BOOLEAN_BINARY_EXPRESSION syntax.

---

## Example: Validate that a field is not empty

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "VALIDATE_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.panNumber", "type": "TEXT FIELD", "name": "panNumber" } },
        { "nodeName": "Using", "value": null },
        { "nodeName": "Expression", "value": null },
        {
          "nodeName": "CONDITION",
          "choice": {
            "nodeName": "COMPARISON_EXPRESSION",
            "items": [
              {
                "nodeName": "EXPRESSION",
                "choice": { "nodeName": "COMPONENT", "value": { "id": "$form.panNumber" } }
              },
              {
                "nodeName": "OPERATOR",
                "choice": { "nodeName": "IS_NOT_EMPTY", "value": null }
              },
              {
                "nodeName": "EXPRESSION",
                "choice": null
              }
            ]
          }
        }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```
