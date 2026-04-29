# Enabled Expressions Grammar

Covers `ACCESS_EXPRESSION` and `DISABLE_EXPRESSION` — both output to `fd:enabled`.

## Semantic difference

| STATEMENT type | Meaning | Else branch node |
|---|---|---|
| `ACCESS_EXPRESSION` | "Enable X when condition, else Disable/No action" | `DONOTHING_OR_DISABLE` → `Disable \| No action` |
| `DISABLE_EXPRESSION` | "Disable X when condition, else Enable/No action" | `DONOTHING_OR_ENABLE` → `Enable \| No action` |

Use `ACCESS_EXPRESSION` when the prompt says "Enable X when …".  
Use `DISABLE_EXPRESSION` when the prompt says "Disable X when …".

---

## Structure

Identical pattern to visibility expressions:

```
ROOT → STATEMENT → ACCESS_EXPRESSION | DISABLE_EXPRESSION
  ├── AFCOMPONENT                (target component)
  ├── When                       (keyword)
  ├── CONDITIONORALWAYS          (COMPARISON_EXPRESSION | BOOLEAN_BINARY_EXPRESSION)
  ├── Else                       (keyword)
  └── DONOTHING_OR_DISABLE       (for ACCESS_EXPRESSION: Disable | No action)
      DONOTHING_OR_ENABLE        (for DISABLE_EXPRESSION: Enable | No action)
```

---

## Skeleton JSON

### ACCESS_EXPRESSION ("Enable X when condition, else Disable")

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "ACCESS_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.field1" } },
        { "nodeName": "When", "value": null },
        {
          "nodeName": "CONDITIONORALWAYS",
          "choice": { ...COMPARISON_EXPRESSION or BOOLEAN_BINARY_EXPRESSION... }
        },
        { "nodeName": "Else", "value": null },
        {
          "nodeName": "DONOTHING_OR_DISABLE",
          "choice": { "nodeName": "Disable", "value": null }
        }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```

### DISABLE_EXPRESSION ("Disable X when condition, else Enable")

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "DISABLE_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.field1" } },
        { "nodeName": "When", "value": null },
        {
          "nodeName": "CONDITIONORALWAYS",
          "choice": { ...COMPARISON_EXPRESSION or BOOLEAN_BINARY_EXPRESSION... }
        },
        { "nodeName": "Else", "value": null },
        {
          "nodeName": "DONOTHING_OR_ENABLE",
          "choice": { "nodeName": "Enable", "value": null }
        }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```

---

## CONDITIONORALWAYS

`CONDITIONORALWAYS` choice is `COMPARISON_EXPRESSION | BOOLEAN_BINARY_EXPRESSION`. See `conditions.md` for full syntax.

```json
{ "nodeName": "CONDITIONORALWAYS", "choice": { "nodeName": "COMPARISON_EXPRESSION", "items": [ ... ] } }
{ "nodeName": "CONDITIONORALWAYS", "choice": { "nodeName": "BOOLEAN_BINARY_EXPRESSION", "items": [ ... ] } }
```

---

## Else branch choices

| STATEMENT | Node | choices |
|---|---|---|
| `ACCESS_EXPRESSION` | `DONOTHING_OR_DISABLE` | `Disable` (disable on else) or `No action` (do nothing on else) |
| `DISABLE_EXPRESSION` | `DONOTHING_OR_ENABLE` | `Enable` (enable on else) or `No action` (do nothing on else) |

```json
{ "nodeName": "DONOTHING_OR_DISABLE", "choice": { "nodeName": "Disable", "value": null } }
{ "nodeName": "DONOTHING_OR_DISABLE", "choice": { "nodeName": "No action", "value": null } }

{ "nodeName": "DONOTHING_OR_ENABLE", "choice": { "nodeName": "Enable", "value": null } }
{ "nodeName": "DONOTHING_OR_ENABLE", "choice": { "nodeName": "No action", "value": null } }
```

---

## fd:* key

Both ACCESS_EXPRESSION and DISABLE_EXPRESSION output to `fd:enabled`.

---

## Worked Examples

### "Enable the submit button when all required fields are filled"

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "ACCESS_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.submitButton" } },
        { "nodeName": "When", "value": null },
        {
          "nodeName": "CONDITIONORALWAYS",
          "choice": {
            "nodeName": "BOOLEAN_BINARY_EXPRESSION",
            "items": [
              {
                "nodeName": "CONDITION",
                "choice": {
                  "nodeName": "COMPARISON_EXPRESSION",
                  "items": [
                    { "nodeName": "EXPRESSION", "choice": { "nodeName": "COMPONENT", "value": { "id": "$form.firstName" } } },
                    { "nodeName": "OPERATOR", "choice": { "nodeName": "IS_NOT_EMPTY", "value": null } },
                    { "nodeName": "EXPRESSION", "choice": null }
                  ]
                }
              },
              { "nodeName": "OPERATOR", "choice": { "nodeName": "AND", "value": null } },
              {
                "nodeName": "CONDITION",
                "choice": {
                  "nodeName": "COMPARISON_EXPRESSION",
                  "items": [
                    { "nodeName": "EXPRESSION", "choice": { "nodeName": "COMPONENT", "value": { "id": "$form.lastName" } } },
                    { "nodeName": "OPERATOR", "choice": { "nodeName": "IS_NOT_EMPTY", "value": null } },
                    { "nodeName": "EXPRESSION", "choice": null }
                  ]
                }
              }
            ]
          }
        },
        { "nodeName": "Else", "value": null },
        { "nodeName": "DONOTHING_OR_DISABLE", "choice": { "nodeName": "Disable", "value": null } }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```

### "Disable the email field when the user selects 'no email'"

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "DISABLE_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.emailField" } },
        { "nodeName": "When", "value": null },
        {
          "nodeName": "CONDITIONORALWAYS",
          "choice": {
            "nodeName": "COMPARISON_EXPRESSION",
            "items": [
              { "nodeName": "EXPRESSION", "choice": { "nodeName": "COMPONENT", "value": { "id": "$form.contactPreference" } } },
              { "nodeName": "OPERATOR", "choice": { "nodeName": "EQUALS_TO", "value": null } },
              { "nodeName": "EXPRESSION", "choice": { "nodeName": "STRING_LITERAL", "value": "no email" } }
            ]
          }
        },
        { "nodeName": "Else", "value": null },
        { "nodeName": "DONOTHING_OR_ENABLE", "choice": { "nodeName": "Enable", "value": null } }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```
