# Visibility Expressions Grammar

Covers `SHOW_EXPRESSION` and `VISIBLE_EXPRESSION` — both output to `fd:visible`.

## Semantic difference

| STATEMENT type | Meaning | Else branch node |
|---|---|---|
| `SHOW_EXPRESSION` | "Show X when condition, else Hide/No action" | `DONOTHING_OR_HIDE` → `Hide \| No action` |
| `VISIBLE_EXPRESSION` | "Hide X when condition, else Show/No action" | `DONOTHING_OR_SHOW` → `Show \| No action` |

Use `SHOW_EXPRESSION` when the prompt says "Show X when …".  
Use `VISIBLE_EXPRESSION` when the prompt says "Hide X when …".

---

## Structure

```
ROOT → STATEMENT → SHOW_EXPRESSION | VISIBLE_EXPRESSION
  ├── AFCOMPONENT                (target component)
  ├── When                       (keyword)
  ├── CONDITIONORALWAYS          (COMPARISON_EXPRESSION | BOOLEAN_BINARY_EXPRESSION)
  ├── Else                       (keyword)
  └── DONOTHING_OR_HIDE          (for SHOW_EXPRESSION: Hide | No action)
      DONOTHING_OR_SHOW          (for VISIBLE_EXPRESSION: Show | No action)
```

---

## Skeleton JSON

### SHOW_EXPRESSION ("Show X when condition, else Hide")

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "SHOW_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.panel1" } },
        { "nodeName": "When", "value": null },
        {
          "nodeName": "CONDITIONORALWAYS",
          "choice": { ...COMPARISON_EXPRESSION or BOOLEAN_BINARY_EXPRESSION... }
        },
        { "nodeName": "Else", "value": null },
        {
          "nodeName": "DONOTHING_OR_HIDE",
          "choice": { "nodeName": "Hide", "value": null }
        }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```

### VISIBLE_EXPRESSION ("Hide X when condition, else Show")

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "VISIBLE_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.panel1" } },
        { "nodeName": "When", "value": null },
        {
          "nodeName": "CONDITIONORALWAYS",
          "choice": { ...COMPARISON_EXPRESSION or BOOLEAN_BINARY_EXPRESSION... }
        },
        { "nodeName": "Else", "value": null },
        {
          "nodeName": "DONOTHING_OR_SHOW",
          "choice": { "nodeName": "Show", "value": null }
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
| `SHOW_EXPRESSION` | `DONOTHING_OR_HIDE` | `Hide` (hide on else) or `No action` (do nothing on else) |
| `VISIBLE_EXPRESSION` | `DONOTHING_OR_SHOW` | `Show` (show on else) or `No action` (do nothing on else) |

```json
{ "nodeName": "DONOTHING_OR_HIDE", "choice": { "nodeName": "Hide", "value": null } }
{ "nodeName": "DONOTHING_OR_HIDE", "choice": { "nodeName": "No action", "value": null } }

{ "nodeName": "DONOTHING_OR_SHOW", "choice": { "nodeName": "Show", "value": null } }
{ "nodeName": "DONOTHING_OR_SHOW", "choice": { "nodeName": "No action", "value": null } }
```

---

## fd:* key

Both SHOW_EXPRESSION and VISIBLE_EXPRESSION output to `fd:visible`.

---

## Worked Examples

### "Show the shipping address panel when the user selects 'ship to address'"

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "SHOW_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.shippingAddressPanel" } },
        { "nodeName": "When", "value": null },
        {
          "nodeName": "CONDITIONORALWAYS",
          "choice": {
            "nodeName": "COMPARISON_EXPRESSION",
            "items": [
              { "nodeName": "EXPRESSION", "choice": { "nodeName": "COMPONENT", "value": { "id": "$form.deliveryOption" } } },
              { "nodeName": "OPERATOR", "choice": { "nodeName": "EQUALS_TO", "value": null } },
              { "nodeName": "EXPRESSION", "choice": { "nodeName": "STRING_LITERAL", "value": "ship to address" } }
            ]
          }
        },
        { "nodeName": "Else", "value": null },
        { "nodeName": "DONOTHING_OR_HIDE", "choice": { "nodeName": "Hide", "value": null } }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```

### "Hide the discount field when the order total is less than 100"

```json
{
  "nodeName": "ROOT",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "VISIBLE_EXPRESSION",
      "items": [
        { "nodeName": "AFCOMPONENT", "value": { "id": "$form.discountField" } },
        { "nodeName": "When", "value": null },
        {
          "nodeName": "CONDITIONORALWAYS",
          "choice": {
            "nodeName": "COMPARISON_EXPRESSION",
            "items": [
              { "nodeName": "EXPRESSION", "choice": { "nodeName": "COMPONENT", "value": { "id": "$form.orderTotal" } } },
              { "nodeName": "OPERATOR", "choice": { "nodeName": "LESS_THAN", "value": null } },
              { "nodeName": "EXPRESSION", "choice": { "nodeName": "NUMERIC_LITERAL", "value": 100 } }
            ]
          }
        },
        { "nodeName": "Else", "value": null },
        { "nodeName": "DONOTHING_OR_SHOW", "choice": { "nodeName": "Show", "value": null } }
      ]
    }
  }],
  "enabled": true,
  "isValid": true,
  "version": 1
}
```
