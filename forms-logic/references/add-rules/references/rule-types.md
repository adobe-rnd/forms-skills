# Rule Types Reference

Compact structural reference for all action types in AEM Forms rules. Each action is wrapped in a `BLOCK_STATEMENT` node. For complete JSON examples, see the [examples/](examples/) directory.

---

## COMPONENT Value Template

Every time a rule references a form component (AFCOMPONENT, VALUE_FIELD, COMPONENT, PANEL, REPEATABLE_COMPONENT), use this structure:

```json
{
  "id": "$form.panelName.fieldName",
  "displayName": "fieldName",
  "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
  "isDuplicate": false,
  "displayPath": "FORM/panelName/",
  "name": "fieldName",
  "parent": "$form.panelName",
  "metadata": {}
}
```

| Field | Format | Notes |
|-------|--------|-------|
| `id` | `$form.panel.field` | Dot-separated path from form root |
| `displayName` | `fieldName` | Last segment of the id |
| `type` | `AFCOMPONENT\|FIELD\|TEXT FIELD\|STRING` | Pipe-separated type chain from `rule-transform` output |
| `isDuplicate` | `false` | Set `true` only if multiple components share the same name |
| `displayPath` | `FORM/panelName/` | Slash-separated ancestor path, always starts with `FORM`, ends with `/` |
| `name` | `fieldName` | Component name (matches form.json) |
| `parent` | `$form.panelName` | Parent component id |
| `metadata` | `{}` | Usually empty object |

> **Tip:** Run `rule-transform <form>.form.json` to get exact values for every component.

---

## Literal Tokens

Some actions use literal keyword tokens as items. These always have `"value": null`:

```json
{ "nodeName": "to", "value": null }
{ "nodeName": "of", "value": null }
{ "nodeName": "on", "value": null }
{ "nodeName": "in", "value": null }
{ "nodeName": "key", "value": null }
{ "nodeName": "value", "value": null }
{ "nodeName": "from", "value": null }
```

---

## 1. SHOW_STATEMENT / HIDE_STATEMENT

Show or hide a form component.

| Property | Value |
|----------|-------|
| **Items** | `[AFCOMPONENT]` |
| **Component type** | `AFCOMPONENT` |
| **Examples** | [visibility/show-on-dropdown.json](examples/visibility/show-on-dropdown.json), [visibility/show-hide-with-else.json](examples/visibility/show-hide-with-else.json), [visibility/hide-multiple-fields.json](examples/visibility/hide-multiple-fields.json) |

HIDE_STATEMENT is identical — just change the `nodeName`.

> **Tip:** For simple show/hide, always use these direct actions. Do NOT use FUNCTION_CALL.

---

## 2. SET_VALUE_STATEMENT

Set a field's value.

| Property | Value |
|----------|-------|
| **Items** | `[VALUE_FIELD, "to", EXPRESSION]` |
| **Component type** | `VALUE_FIELD` (uses full type chain, e.g. `AFCOMPONENT\|FIELD\|TEXT FIELD\|STRING`) |
| **EXPRESSION options** | `NUMERIC_LITERAL`, `STRING_LITERAL`, `BOOLEAN_LITERAL`, `COMPONENT` (from another field), `FUNCTION_CALL` (computed), `GET_VARIABLE` |
| **Examples** | [value/set-value-literal.json](examples/value/set-value-literal.json), [value/set-from-field.json](examples/value/set-from-field.json), [value/enable-disable.json](examples/value/enable-disable.json), [value/clear-on-change.json](examples/value/clear-on-change.json) |

> **Note:** VALUE_FIELD uses the full type from treeJson (e.g. `AFCOMPONENT|FIELD|TEXT FIELD|STRING`), while AFCOMPONENT in show/hide uses just `AFCOMPONENT`.

---

## 3. CLEAR_VALUE_STATEMENT

Clear a field's value.

| Property | Value |
|----------|-------|
| **Items** | `[VALUE_FIELD]` |
| **Examples** | [value/clear-on-change.json](examples/value/clear-on-change.json) |

---

## 4. ENABLE_STATEMENT / DISABLE_STATEMENT

Enable or disable a form component.

| Property | Value |
|----------|-------|
| **Items** | `[AFCOMPONENT]` |
| **Examples** | [value/enable-disable.json](examples/value/enable-disable.json) |

DISABLE_STATEMENT is identical — just change the `nodeName`.

---

## 5. SET_VARIABLE

Store a variable value on a component. **6 items** in strict order.

| Property | Value |
|----------|-------|
| **Items** | `["key", VARIABLE_NAME, "value", VARIABLE_VALUE, "on", AFCOMPONENT]` |
| **Examples** | [variable/set-variable.json](examples/variable/set-variable.json), [variable/use-variable-condition.json](examples/variable/use-variable-condition.json) |

**VARIABLE_NAME options:** `STRING_LITERAL`, `AFCOMPONENT`, `FUNCTION_CALL`, `GET_VARIABLE`

**VARIABLE_VALUE options:** `STRING_LITERAL`, `NUMERIC_LITERAL`, `BOOLEAN_LITERAL`, `AFCOMPONENT`, `FUNCTION_CALL`, `GET_VARIABLE`

> **Critical:** All 6 items must be present in exactly this order. The literal tokens `key`, `value`, and `on` must have `"value": null`.

---

## 6. GET_VARIABLE

Retrieve a stored variable. Used inside EXPRESSION (not as a standalone action).

| Property | Value |
|----------|-------|
| **Items** | `["key", VARIABLE_NAME, "from", AFCOMPONENT]` |
| **Examples** | [variable/use-variable-condition.json](examples/variable/use-variable-condition.json) |

GET_VARIABLE is typically used inside SET_VALUE_STATEMENT as the EXPRESSION, or inside a CONDITION.

---

## 7. DISPATCH_EVENT

Fire a custom event on a component.

| Property | Value |
|----------|-------|
| **Items** | `[STRING_LITERAL, "on", AFCOMPONENT]` |
| **Event format** | `"custom:eventName"` |
| **Examples** | [dispatch-event/fire-custom-event.json](examples/dispatch-event/fire-custom-event.json) |

**Listening for the event:** On the receiver side, use the custom event name as the TRIGGER_EVENT value:

```json
{ "nodeName": "TRIGGER_EVENT", "value": "custom:paymentComplete" }
```

> **Cross-fragment communication:** Dispatch events on `$form` (the form root). Any component in the entire form tree can listen for events dispatched on the form root.

---

## 8. FUNCTION_CALL

Call a custom or OOTB function. Uses `functionName` (object) + `params` (array).

| Property | Value |
|----------|-------|
| **Examples** | [function/api-call/rule.json](examples/function/api-call/rule.json), [function/calculation/rule.json](examples/function/calculation/rule.json) |
| **Common mistakes** | [function/common-mistakes.md](examples/function/common-mistakes.md) |

### functionName object (required fields)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Function identifier (e.g. `"concat"`, `"fetchCustomer"`) |
| `displayName` | string | Display name for rule editor |
| `type` | string | Return type (`STRING`, `NUMBER`, `DATE`, `BOOLEAN`, `OBJECT`) |
| `isDuplicate` | boolean | Usually `false` |
| `displayPath` | string | `""` for custom/OOTB functions |
| `args` | array | Function signature — each entry: `{ "type", "name", "description", "isMandatory" }` |
| `impl` | string | Positional pattern: `"$0($1, $2)"` — `$0` = function id, `$1`+ = params |

### params array

Each param must be wrapped in EXPRESSION with `choice`:

```json
{ "nodeName": "EXPRESSION", "choice": { "nodeName": "COMPONENT", "value": { ... } } }
{ "nodeName": "EXPRESSION", "choice": { "nodeName": "STRING_LITERAL", "value": "hello" } }
```

> **NEVER** put `value` directly on the param — always use the `choice` wrapper. Missing `choice` causes `"getChoiceModel is not a function"` crash.

### parentNodeName rules

| Context | parentNodeName |
|---------|----------------|
| Direct action in BLOCK_STATEMENT | `"BLOCK_STATEMENT"` |
| Value source in EXPRESSION | `"EXPRESSION"` |
| Value source in EXTENDED_EXPRESSION | `"EXTENDED_EXPRESSION"` |
| Inside VARIABLE_VALUE | `"VARIABLE_VALUE"` |
| Inside VARIABLE_NAME | `"VARIABLE_NAME"` |
| Inside NAVIGATE_TO_EXPRESSION | `"NAVIGATE_TO_EXPRESSION"` |

### impl pattern

| Params | impl |
|--------|------|
| 0 | `"$0()"` |
| 1 | `"$0($1)"` |
| 2 | `"$0($1, $2)"` |
| 3 | `"$0($1, $2, $3)"` |

> **Critical:** `params` count must equal `args` count. `args` is the signature definition; `params` is the actual values. NEVER put arguments inside `functionName.args` at runtime.

---

## 9. NAVIGATE_TO

Navigate to a URL.

| Property | Value |
|----------|-------|
| **Items** | `[NAVIGATE_TO_EXPRESSION, "in", NAVIGATE_METHOD_OPTIONS]` |
| **Examples** | [navigation/navigate-url.json](examples/navigation/navigate-url.json) |

**NAVIGATE_TO_EXPRESSION options:**

| Option | Use When |
|--------|----------|
| `URL_LITERAL` | Direct URL string |
| `COMPONENT` | URL stored in a form field |
| `FUNCTION_CALL` | URL constructed by a function |

**NAVIGATE_METHOD_OPTIONS:**

| Option | Opens In |
|--------|----------|
| `NEW_WINDOW` | New browser window |
| `NEW_TAB` | New browser tab |
| `SAME_TAB` | Current tab (replaces page) |

---

## 10. NAVIGATE_IN_PANEL

Navigate within a wizard or tabbed panel.

| Property | Value |
|----------|-------|
| **Items** | `[PANEL_FOCUS_OPTION, "of", PANEL]` |
| **Examples** | [navigation/navigate-panel.json](examples/navigation/navigate-panel.json) |

**PANEL_FOCUS_OPTION values:**

| Option | Direction |
|--------|-----------|
| `NEXT_ITEM` | Go to next panel/tab |
| `PREVIOUS_ITEM` | Go to previous panel/tab |
| `FIRST_ITEM` | Go to first panel/tab |

> **Note:** PANEL value uses `AFCOMPONENT|PANEL` type (not the full field type chain).

---

## 11. SET_PROPERTY

Set a property of a component.

| Property | Value |
|----------|-------|
| **Items** | `[MEMBER_EXPRESSION, "to", EXTENDED_EXPRESSION]` |
| **Examples** | [property/set-label.json](examples/property/set-label.json), [property/set-placeholder.json](examples/property/set-placeholder.json), [property/set-required.json](examples/property/set-required.json) |

MEMBER_EXPRESSION contains: `[PROPERTY_LIST, "of", COMPONENT]`

**Available properties by component type:**

| Property | Value Type | Description | Applicable To |
|----------|-----------|-------------|---------------|
| `visible` | BOOLEAN | Show/hide component | All components |
| `enabled` | BOOLEAN | Enable/disable interaction | All components |
| `label` | STRING | Field label text | All field types |
| `placeholder` | STRING | Placeholder text | Text inputs, dropdowns |
| `required` | BOOLEAN | Make field mandatory | All field types |
| `value` | varies | Field value | All field types |
| `readOnly` | BOOLEAN | Make field read-only | All field types |

> **Note:** For simple visibility/enabled toggling, prefer SHOW/HIDE/ENABLE/DISABLE statements over SET_PROPERTY. Use SET_PROPERTY only for `label`, `placeholder`, `required`, etc.

---

## 12. Additional Actions

### SUBMIT_FORM

| Items | `[]` (empty) |
|-------|-------------|
| **Examples** | [form-action/submit-form.json](examples/form-action/submit-form.json) |

### RESET_FORM

| Items | `[AFCOMPONENT]` |
|-------|-----------------|
| **Examples** | [form-action/reset-panel.json](examples/form-action/reset-panel.json) |

### VALIDATE_FORM

| Items | `[AFCOMPONENT]` |
|-------|-----------------|
| **Examples** | [form-action/validate-field.json](examples/form-action/validate-field.json) |

### SAVE_FORM

| Items | `[]` (empty) |
|-------|-------------|

### SET_FOCUS

| Items | `["to", AFCOMPONENT]` |
|-------|----------------------|

### ADD_INSTANCE / REMOVE_INSTANCE

| Items | `["of", REPEATABLE_COMPONENT]` |
|-------|-------------------------------|
| **Examples** | [instance/add-instance.json](examples/instance/add-instance.json), [instance/remove-instance.json](examples/instance/remove-instance.json) |

REMOVE_INSTANCE is identical — just change the `nodeName`.

---

## Conditions

Conditions use the CONDITION node with `"nested": false` and a `choice` containing a comparison or boolean expression.

| Type | Examples |
|------|----------|
| **Comparison (equals, not equals, etc.)** | [conditions/comparison-equals.json](examples/conditions/comparison-equals.json), [conditions/comparison-unary.json](examples/conditions/comparison-unary.json) |
| **Boolean (AND, OR)** | [conditions/boolean-and.json](examples/conditions/boolean-and.json), [conditions/boolean-or.json](examples/conditions/boolean-or.json) |

**Unary operators (no right-hand side):** `IS_EMPTY`, `IS_NOT_EMPTY`

**Binary operators:** `EQUALS`, `NOT_EQUALS`, `GREATER_THAN`, `GREATER_THAN_EQUALS`, `LESS_THAN`, `LESS_THAN_EQUALS`, `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`

> **Prefer operators over functions:** For conditions, use `IS_EMPTY`, `IS_NOT_EMPTY`, etc. NOT function calls like `isEmpty()`.

---

## Quick Reference: Items Count by Action Type

| Action | Items | Pattern |
|--------|-------|---------|
| SHOW_STATEMENT | 1 | `[AFCOMPONENT]` |
| HIDE_STATEMENT | 1 | `[AFCOMPONENT]` |
| ENABLE_STATEMENT | 1 | `[AFCOMPONENT]` |
| DISABLE_STATEMENT | 1 | `[AFCOMPONENT]` |
| CLEAR_VALUE_STATEMENT | 1 | `[VALUE_FIELD]` |
| SET_VALUE_STATEMENT | 3 | `[VALUE_FIELD, "to", EXPRESSION]` |
| SET_FOCUS | 2 | `["to", AFCOMPONENT]` |
| ADD_INSTANCE | 2 | `["of", REPEATABLE_COMPONENT]` |
| REMOVE_INSTANCE | 2 | `["of", REPEATABLE_COMPONENT]` |
| DISPATCH_EVENT | 3 | `[STRING_LITERAL, "on", AFCOMPONENT]` |
| NAVIGATE_TO | 3 | `[NAVIGATE_TO_EXPRESSION, "in", NAVIGATE_METHOD_OPTIONS]` |
| NAVIGATE_IN_PANEL | 3 | `[PANEL_FOCUS_OPTION, "of", PANEL]` |
| SET_PROPERTY | 3 | `[MEMBER_EXPRESSION, "to", EXTENDED_EXPRESSION]` |
| SET_VARIABLE | 6 | `["key", VARIABLE_NAME, "value", VARIABLE_VALUE, "on", AFCOMPONENT]` |
| SUBMIT_FORM | 0 | `[]` |
| SAVE_FORM | 0 | `[]` |
| RESET_FORM | 1 | `[AFCOMPONENT]` |
| VALIDATE_FORM | 1 | `[AFCOMPONENT]` |