# Grammar Reference

**Source of truth:** `tools/rule_coder/grammar/annotated_subset_grammar.json` — Read this file directly when: (1) a rule fails validation or save, (2) you're unsure about a node's structure, or (3) the action type isn't covered below.

---

## Grammar Rules

| Rule | Details |
|------|---------|
| **CONDITION nested** | Every CONDITION must have `"nested": false` property |
| **Empty condition** | No condition = `"choice": null`, NOT `"choice": {}` |
| **Literal tokens** | When/Then/Else/to/of/on/key/value/from/in = `{"nodeName": "X", "value": null}` |
| **FUNCTION_CALL** | Uses `functionName` (object) + `params` (array), NOT `value.args` |
| **No arithmetic nodes** | For `a + b * c`, use FUNCTION_CALL, NOT BINARY_EXPRESSION |
| **Trigger ≠ Condition** | Trigger event (click/change) is separate from conditions. Never combine them with AND/OR. |
| **VARIABLE transparency** | When a node has rule `VARIABLE`, do NOT create a VARIABLE node. Put the actual value directly in the parent node. |
| **Else is optional** | Only include Else block and second BLOCK_STATEMENTS when else actions are explicitly mentioned. |

---

## Master Rule JSON Structure

All rules follow this pattern: `ROOT → STATEMENT → TRIGGER_SCRIPTS → SINGLE_TRIGGER_SCRIPTS`

```json
{
  "nodeName": "ROOT",
  "isValid": true,
  "enabled": true,
  "eventName": "Descriptive Event Name",
  "items": [{
    "nodeName": "STATEMENT",
    "choice": {
      "nodeName": "TRIGGER_SCRIPTS",
      "items": [{
        "nodeName": "SINGLE_TRIGGER_SCRIPTS",
        "items": [
          { /* 1. COMPONENT — what triggers the rule */ },
          { /* 2. TRIGGER_EVENT — the event type */ },
          { "nodeName": "When", "value": null },
          { /* 4. TRIGGER_EVENT_SCRIPTS — condition + actions */ }
        ]
      }]
    }
  }]
}
```

### TRIGGER_EVENT_SCRIPTS (with else)

```json
{
  "nodeName": "TRIGGER_EVENT_SCRIPTS",
  "items": [
    { /* CONDITION */ },
    { "nodeName": "Then", "value": null },
    { /* BLOCK_STATEMENTS (then actions) */ },
    { "nodeName": "Else", "value": null },
    { /* BLOCK_STATEMENTS (else actions) */ }
  ]
}
```

### TRIGGER_EVENT_SCRIPTS (without else)

```json
{
  "nodeName": "TRIGGER_EVENT_SCRIPTS",
  "items": [
    { /* CONDITION */ },
    { "nodeName": "Then", "value": null },
    { /* BLOCK_STATEMENTS (then actions) */ }
  ]
}
```

---

## COMPONENT Structure

Used as trigger component (nodeName `COMPONENT`), action target (nodeName `AFCOMPONENT` or `VALUE_FIELD`), or panel reference (nodeName `PANEL`).

```json
{
  "nodeName": "AFCOMPONENT",
  "value": {
    "id": "$form.panel.fieldName",
    "displayName": "Field Display Name",
    "type": "AFCOMPONENT",
    "isDuplicate": false,
    "displayPath": "FORM/panel/",
    "name": "fieldName",
    "parent": "$form.panel",
    "metadata": {}
  }
}
```

**Component type variants:**

| nodeName | When to Use | type field |
|----------|------------|------------|
| `COMPONENT` | Trigger component (item 1 in SINGLE_TRIGGER_SCRIPTS) | Full type from treeJson (e.g. `AFCOMPONENT\|FIELD\|TEXT FIELD\|STRING`) |
| `AFCOMPONENT` | Action targets (show/hide/enable/disable/dispatch/variable) | `AFCOMPONENT` |
| `VALUE_FIELD` | Set value / clear value targets | Full type from treeJson (e.g. `AFCOMPONENT\|FIELD\|NUMBER FIELD\|NUMBER`) |
| `PANEL` | Panel navigation targets | `AFCOMPONENT\|PANEL` |
| `REPEATABLE_COMPONENT` | Add/remove instance targets | `AFCOMPONENT` |

**Fields:**
- `id` — Qualified path: `$form.panel.fieldName`
- `displayName` — Human-readable name
- `type` — Component type string from treeJson
- `isDuplicate` — `false` (set `true` only if duplicate names exist)
- `displayPath` — Breadcrumb path: `FORM/panel/`
- `name` — Component name (last segment of id)
- `parent` — Parent qualified path: `$form.panel`
- `metadata` — `{}` (empty object)

---

## TRIGGER_EVENT Options

### Field-Level Events

| Event Value | Valid For | Description |
|-------------|-----------|-------------|
| `is clicked` | Button only | When component is clicked |
| `is changed` | Input fields (text, number, date, checkbox, file) | When field value changes (Value Commit) |
| `is initialized` | Any component, form | When component initializes/loads |

### Form Root Node Events

| Event Value | Description |
|-------------|-------------|
| `is submitted successfully` | Successful form submission |
| `submission fails` | Error in submission |
| `is saved successfully` | Form saved successfully |
| `fails to save` | Error while saving the form |

### Custom Events

Any string not matching a standard event is treated as a custom event name:

```json
{ "nodeName": "TRIGGER_EVENT", "value": "custom:myEventName" }
```

**Note:** `is blurred` and `is focused` are NOT valid OOTB events. Use `is changed` for validation on value commit.

---

## Condition Structure

### CONDITION Node

```json
{
  "nodeName": "CONDITION",
  "nested": false,
  "choice": { /* COMPARISON_EXPRESSION or BOOLEAN_BINARY_EXPRESSION or null */ }
}
```

**Empty condition (always execute):**

```json
{
  "nodeName": "CONDITION",
  "nested": false,
  "choice": null
}
```

### COMPARISON_EXPRESSION (Single Comparison)

Binary comparison (field equals value):

```json
{
  "nodeName": "COMPARISON_EXPRESSION",
  "items": [
    {
      "nodeName": "EXPRESSION",
      "choice": { "nodeName": "COMPONENT", "value": { "id": "...", "name": "..." } }
    },
    {
      "nodeName": "OPERATOR",
      "choice": { "nodeName": "EQUALS_TO", "value": null }
    },
    {
      "nodeName": "EXPRESSION",
      "choice": { "nodeName": "STRING_LITERAL", "value": "someValue" }
    }
  ]
}
```

Unary comparison (field is empty — **NO right EXPRESSION**):

```json
{
  "nodeName": "COMPARISON_EXPRESSION",
  "items": [
    {
      "nodeName": "EXPRESSION",
      "choice": { "nodeName": "COMPONENT", "value": { "id": "...", "name": "..." } }
    },
    {
      "nodeName": "OPERATOR",
      "choice": { "nodeName": "IS_EMPTY", "value": null }
    }
  ]
}
```

### BOOLEAN_BINARY_EXPRESSION (AND/OR)

Combines two conditions:

```json
{
  "nodeName": "BOOLEAN_BINARY_EXPRESSION",
  "items": [
    {
      "nodeName": "CONDITION",
      "nested": false,
      "choice": { "nodeName": "COMPARISON_EXPRESSION", "items": [ /* ... */ ] }
    },
    {
      "nodeName": "BOOLEAN_BINARY_OPERATOR",
      "choice": { "nodeName": "AND", "value": null }
    },
    {
      "nodeName": "CONDITION",
      "nested": false,
      "choice": { "nodeName": "COMPARISON_EXPRESSION", "items": [ /* ... */ ] }
    }
  ]
}
```

For 3+ conditions, nest BOOLEAN_BINARY_EXPRESSIONs: left side is a CONDITION wrapping another BOOLEAN_BINARY_EXPRESSION, right side is the new condition.

---

## Expression Types

Expressions appear inside COMPARISON_EXPRESSION items and as values in SET_VALUE_STATEMENT, SET_VARIABLE, etc.

```json
{
  "nodeName": "EXPRESSION",
  "choice": { /* one of the types below */ }
}
```

| Expression Type | choice.nodeName | choice.value | Example |
|-----------------|-----------------|--------------|---------|
| Form field | `COMPONENT` | `{ "id": "...", "name": "...", ... }` | Reference to a form component |
| String | `STRING_LITERAL` | `"hello world"` | Text value |
| Number | `NUMERIC_LITERAL` | `42` or `10.5` | Numeric value |
| Boolean | `BOOLEAN_LITERAL` | N/A — uses nested choice | true/false |
| Date | `DATE_LITERAL` | `"2024-01-15"` | ISO date string |
| Function result | `FUNCTION_CALL` | `{ functionName: {...}, params: [...] }` | Calculated value |
| UTM parameter | `UTM_PARAMETER` | `"utm_source"` | UTM tracking param |
| Query parameter | `QUERY_PARAMETER` | `"paramName"` | URL query param |
| Browser details | `BROWSER_DETAILS` | `"userAgent"` / `"language"` / `"platform"` | Browser info |
| URL details | `URL_DETAILS` | `"hostname"` / `"pathname"` | URL components |
| Stored variable | `GET_VARIABLE` | N/A — uses items array | Retrieved variable |

### BOOLEAN_LITERAL (Nested Choice Pattern)

BOOLEAN_LITERAL is a CHOICE node, not a terminal. It wraps True/False:

```json
{
  "nodeName": "BOOLEAN_LITERAL",
  "choice": {
    "nodeName": "True",
    "value": null
  }
}
```

```json
{
  "nodeName": "BOOLEAN_LITERAL",
  "choice": {
    "nodeName": "False",
    "value": null
  }
}
```

### GET_VARIABLE (Sequence)

GET_VARIABLE is a SEQUENCE with 4 items:

```json
{
  "nodeName": "GET_VARIABLE",
  "items": [
    { "nodeName": "key", "value": null },
    { "nodeName": "STRING_LITERAL", "value": "myVariableName" },
    { "nodeName": "from", "value": null },
    { "nodeName": "AFCOMPONENT", "value": { "id": "...", "name": "..." } }
  ]
}
```

---

## Conditions: Operators vs Functions

**ALWAYS prefer built-in operators over function calls:**

| User Says | Use Operator | NOT This |
|-----------|-------------|----------|
| "is empty", "is blank" | `IS_EMPTY` | ~~isEmpty(field)~~ |
| "is not empty", "has value" | `IS_NOT_EMPTY` | ~~!isEmpty(field)~~ |
| "is true", "is checked" | `IS_TRUE` | ~~field == true~~ |
| "is false", "is unchecked" | `IS_FALSE` | ~~field == false~~ |
| "equals", "is", "same as" | `EQUALS_TO` | — |
| "not equals", "!=" | `NOT_EQUALS_TO` | — |
| "contains", "includes" | `CONTAINS` | ~~contains(field, val)~~ |
| "starts with", "begins with" | `STARTS_WITH` | — |
| "ends with" | `ENDS_WITH` | — |
| "greater than", ">" | `GREATER_THAN` | — |
| "less than", "<" | `LESS_THAN` | — |
| "is valid" | `IS_VALID` | — |
| "is not valid", "invalid" | `IS_NOT_VALID` | — |
| "is before" (date) | `IS_BEFORE` | — |
| "is after" (date) | `IS_AFTER` | — |
| "has selected" (multi-select) | `HAS_SELECTED` | — |

---

## Full Operator Catalog

### Binary Operators (13) — Require Left + Right EXPRESSION

| nodeName | Natural Language | Notes |
|----------|-----------------|-------|
| `EQUALS_TO` | equals, is equal to, is, same as | Any type |
| `NOT_EQUALS_TO` | not equals, is not equal to, !=, different from | Any type |
| `GREATER_THAN` | greater than, more than, > | Numeric |
| `LESS_THAN` | less than, smaller than, < | Numeric |
| `GREATER_THAN_OR_EQUAL` | greater than or equal, >=, at least | Numeric |
| `LESS_THAN_OR_EQUAL` | less than or equal, <=, at most | Numeric |
| `CONTAINS` | contains, includes | String |
| `DOES_NOT_CONTAIN` | does not contain, excludes | String |
| `STARTS_WITH` | starts with, begins with | String |
| `ENDS_WITH` | ends with, finishes with | String |
| `IS_BEFORE` | is before, before | Date comparison |
| `IS_AFTER` | is after, after | Date comparison |
| `HAS_SELECTED` | has selected, selected | Multi-select / checkbox group |

All binary operators use this pattern:

```json
{
  "nodeName": "COMPARISON_EXPRESSION",
  "items": [
    { "nodeName": "EXPRESSION", "choice": { /* left operand */ } },
    { "nodeName": "OPERATOR", "choice": { "nodeName": "EQUALS_TO", "value": null } },
    { "nodeName": "EXPRESSION", "choice": { /* right operand */ } }
  ]
}
```

### Unary Operators (6) — NO Right EXPRESSION

| nodeName | Natural Language | Notes |
|----------|-----------------|-------|
| `IS_EMPTY` | is empty, is blank, has no value | Any field |
| `IS_NOT_EMPTY` | is not empty, has value, is filled | Any field |
| `IS_TRUE` | is true, is checked | Boolean / checkbox |
| `IS_FALSE` | is false, is unchecked | Boolean / checkbox |
| `IS_VALID` | is valid, valid | Validation check |
| `IS_NOT_VALID` | is not valid, invalid | Validation check |

All unary operators use this pattern (only 2 items, no right EXPRESSION):

```json
{
  "nodeName": "COMPARISON_EXPRESSION",
  "items": [
    { "nodeName": "EXPRESSION", "choice": { /* left operand */ } },
    { "nodeName": "OPERATOR", "choice": { "nodeName": "IS_EMPTY", "value": null } }
  ]
}
```

### Boolean Combinators (AND/OR)

Used in BOOLEAN_BINARY_EXPRESSION to combine conditions. NOT placed in COMPARISON_EXPRESSION.

| nodeName | Natural Language |
|----------|-----------------|
| `AND` | and, && |
| `OR` | or, \|\| |

```json
{
  "nodeName": "BOOLEAN_BINARY_OPERATOR",
  "choice": { "nodeName": "AND", "value": null }
}
```

---

## BLOCK_STATEMENTS / BLOCK_STATEMENT

Actions live inside BLOCK_STATEMENTS (array of BLOCK_STATEMENT nodes):

```json
{
  "nodeName": "BLOCK_STATEMENTS",
  "items": [
    {
      "nodeName": "BLOCK_STATEMENT",
      "choice": {
        "nodeName": "SHOW_STATEMENT",
        "items": [ /* action-specific items */ ]
      }
    },
    {
      "nodeName": "BLOCK_STATEMENT",
      "choice": {
        "nodeName": "SET_VALUE_STATEMENT",
        "items": [ /* action-specific items */ ]
      }
    }
  ]
}
```

Each BLOCK_STATEMENT selects exactly one action type as its choice. Multiple actions = multiple BLOCK_STATEMENT entries in the items array.

---

## Valid NodeNames Whitelist

**ONLY use these exact nodeNames. NEVER invent new ones.**

### Structure Nodes

`ROOT`, `STATEMENT`, `TRIGGER_SCRIPTS`, `SINGLE_TRIGGER_SCRIPTS`, `TRIGGER_EVENT_SCRIPTS`, `TRIGGER_EVENT`, `CONDITION`, `COMPARISON_EXPRESSION`, `BOOLEAN_BINARY_EXPRESSION`, `EXPRESSION`, `EXTENDED_EXPRESSION`, `OPERATOR`, `BOOLEAN_BINARY_OPERATOR`, `BLOCK_STATEMENTS`, `BLOCK_STATEMENT`

### Literal Token Nodes

`When`, `Then`, `Else`, `to`, `of`, `in`, `on`, `key`, `value`, `from`

All literal tokens have the same shape: `{ "nodeName": "<token>", "value": null }`

### Component Type Nodes

`COMPONENT`, `AFCOMPONENT`, `VALUE_FIELD`, `PANEL`, `REPEATABLE_COMPONENT`

### Literal Value Nodes

`STRING_LITERAL`, `NUMERIC_LITERAL`, `BOOLEAN_LITERAL`, `DATE_LITERAL`, `URL_LITERAL`

### Boolean Literal Choice Nodes

`True`, `False`

### Operator Nodes (Binary)

`EQUALS_TO`, `NOT_EQUALS_TO`, `GREATER_THAN`, `LESS_THAN`, `GREATER_THAN_OR_EQUAL`, `LESS_THAN_OR_EQUAL`, `CONTAINS`, `DOES_NOT_CONTAIN`, `STARTS_WITH`, `ENDS_WITH`, `IS_BEFORE`, `IS_AFTER`, `HAS_SELECTED`

### Operator Nodes (Unary)

`IS_EMPTY`, `IS_NOT_EMPTY`, `IS_TRUE`, `IS_FALSE`, `IS_VALID`, `IS_NOT_VALID`

### Boolean Combinator Nodes

`AND`, `OR`

### Action Nodes

`SHOW_STATEMENT`, `HIDE_STATEMENT`, `SET_VALUE_STATEMENT`, `CLEAR_VALUE_STATEMENT`, `ENABLE_STATEMENT`, `DISABLE_STATEMENT`, `SET_FOCUS`, `DISPATCH_EVENT`, `FUNCTION_CALL`, `SET_PROPERTY`, `RESET_FORM`, `VALIDATE_FORM`, `SUBMIT_FORM`, `SAVE_FORM`, `NAVIGATE_TO`, `ADD_INSTANCE`, `REMOVE_INSTANCE`, `NAVIGATE_IN_PANEL`, `SET_VARIABLE`

### Navigation Sub-Nodes

`NAVIGATE_TO_EXPRESSION`, `NAVIGATE_METHOD_OPTIONS`, `NEW_WINDOW`, `NEW_TAB`, `SAME_TAB`, `PANEL_FOCUS_OPTION`, `NEXT_ITEM`, `PREVIOUS_ITEM`, `FIRST_ITEM`

### Property Sub-Nodes

`MEMBER_EXPRESSION`, `PROPERTY_LIST`

### Variable Sub-Nodes

`VARIABLE_NAME`, `VARIABLE_VALUE`, `GET_VARIABLE`, `SET_VARIABLE`

### Context Expression Nodes

`UTM_PARAMETER`, `QUERY_PARAMETER`, `BROWSER_DETAILS`, `URL_DETAILS`

---

## Not Supported

The following are NOT in the subset grammar. Do not use them:

| Category | Names | Alternative |
|----------|-------|-------------|
| Actions | `WSDL_STATEMENT`, `ASYNC_FUNCTION_CALL` | Use `FUNCTION_CALL` with custom functions |
| Expressions | `BINARY_EXPRESSION`, `STRING_BINARY_EXPRESSION`, `ARITHMETIC_EXPRESSION` | Use `FUNCTION_CALL` for calculations |