# Rule Types Reference

Complete JSON structures for all action types in AEM Forms rules. Each action is wrapped in a BLOCK_STATEMENT node.

---

## 1. SHOW_STATEMENT / HIDE_STATEMENT

Show or hide a form component. Takes a single AFCOMPONENT.

**Items:** `[AFCOMPONENT]`

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SHOW_STATEMENT",
    "items": [
      {
        "nodeName": "AFCOMPONENT",
        "value": {
          "id": "$form.panel1.emailField",
          "displayName": "emailField",
          "type": "AFCOMPONENT",
          "isDuplicate": false,
          "displayPath": "FORM/panel1/",
          "name": "emailField",
          "parent": "$form.panel1",
          "metadata": {}
        }
      }
    ]
  }
}
```

HIDE_STATEMENT is identical — just change `"nodeName": "HIDE_STATEMENT"`.

> **Tip:** For simple show/hide, always use these direct actions. Do NOT use FUNCTION_CALL to call a custom show/hide function.

---

## 2. SET_VALUE_STATEMENT

Set a field's value. Takes VALUE_FIELD, the literal token `to`, and an EXPRESSION.

**Items:** `[VALUE_FIELD, "to", EXPRESSION]`

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SET_VALUE_STATEMENT",
    "items": [
      {
        "nodeName": "VALUE_FIELD",
        "value": {
          "id": "$form.panel1.totalField",
          "displayName": "totalField",
          "type": "AFCOMPONENT|FIELD|NUMBER FIELD|NUMBER",
          "isDuplicate": false,
          "displayPath": "FORM/panel1/",
          "name": "totalField",
          "parent": "$form.panel1",
          "metadata": {}
        }
      },
      { "nodeName": "to", "value": null },
      {
        "nodeName": "EXPRESSION",
        "choice": {
          "nodeName": "NUMERIC_LITERAL",
          "value": 100
        }
      }
    ]
  }
}
```

### Setting value from another field

Replace the EXPRESSION with a COMPONENT reference:

```json
{
  "nodeName": "EXPRESSION",
  "choice": {
    "nodeName": "COMPONENT",
    "value": {
      "id": "$form.panel1.sourceField",
      "displayName": "sourceField",
      "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
      "isDuplicate": false,
      "displayPath": "FORM/panel1/",
      "name": "sourceField",
      "parent": "$form.panel1",
      "metadata": {}
    }
  }
}
```

### Setting value from a function call

Replace the EXPRESSION with a FUNCTION_CALL:

```json
{
  "nodeName": "EXPRESSION",
  "choice": {
    "nodeName": "FUNCTION_CALL",
    "parentNodeName": "EXPRESSION",
    "functionName": {
      "id": "sum",
      "displayName": "Sum of",
      "type": "NUMBER",
      "isDuplicate": false,
      "displayPath": "",
      "args": [
        { "type": "NUMBER", "name": "list", "description": "numbers to aggregate", "isMandatory": true }
      ],
      "impl": "$0($1)"
    },
    "params": [
      {
        "nodeName": "EXPRESSION",
        "choice": {
          "nodeName": "COMPONENT",
          "value": {
            "id": "$form.panel1.priceField",
            "displayName": "priceField",
            "type": "AFCOMPONENT|FIELD|NUMBER FIELD|NUMBER",
            "isDuplicate": false,
            "displayPath": "FORM/panel1/",
            "name": "priceField",
            "parent": "$form.panel1",
            "metadata": {}
          }
        }
      }
    ]
  }
}
```

> **Note:** VALUE_FIELD uses the full type from treeJson (e.g. `AFCOMPONENT|FIELD|TEXT FIELD|STRING`), while AFCOMPONENT in show/hide uses just `AFCOMPONENT`.

---

## 3. CLEAR_VALUE_STATEMENT

Clear a field's value. Takes a single VALUE_FIELD.

**Items:** `[VALUE_FIELD]`

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "CLEAR_VALUE_STATEMENT",
    "items": [
      {
        "nodeName": "VALUE_FIELD",
        "value": {
          "id": "$form.panel1.searchField",
          "displayName": "searchField",
          "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
          "isDuplicate": false,
          "displayPath": "FORM/panel1/",
          "name": "searchField",
          "parent": "$form.panel1",
          "metadata": {}
        }
      }
    ]
  }
}
```

---

## 4. ENABLE_STATEMENT / DISABLE_STATEMENT

Enable or disable a form component. Takes a single AFCOMPONENT.

**Items:** `[AFCOMPONENT]`

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "ENABLE_STATEMENT",
    "items": [
      {
        "nodeName": "AFCOMPONENT",
        "value": {
          "id": "$form.panel1.submitButton",
          "displayName": "submitButton",
          "type": "AFCOMPONENT",
          "isDuplicate": false,
          "displayPath": "FORM/panel1/",
          "name": "submitButton",
          "parent": "$form.panel1",
          "metadata": {}
        }
      }
    ]
  }
}
```

DISABLE_STATEMENT is identical — just change `"nodeName": "DISABLE_STATEMENT"`.

---

## 5. SET_VARIABLE

Store a variable value on a component. **6 items** in strict order.

**Items:** `["key", VARIABLE_NAME, "value", VARIABLE_VALUE, "on", AFCOMPONENT]`

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SET_VARIABLE",
    "items": [
      { "nodeName": "key", "value": null },
      {
        "nodeName": "STRING_LITERAL",
        "value": "userRole"
      },
      { "nodeName": "value", "value": null },
      {
        "nodeName": "STRING_LITERAL",
        "value": "admin"
      },
      { "nodeName": "on", "value": null },
      {
        "nodeName": "AFCOMPONENT",
        "value": {
          "id": "$form",
          "displayName": "Form",
          "type": "FORM",
          "isDuplicate": false,
          "displayPath": "FORM/",
          "name": "form",
          "parent": "",
          "metadata": {}
        }
      }
    ]
  }
}
```

### VARIABLE_NAME options

The key (item 2) can be:
- `STRING_LITERAL` — direct variable name as string
- `AFCOMPONENT` — variable name from a form field value
- `FUNCTION_CALL` — variable name from function result
- `GET_VARIABLE` — variable name from another variable

### VARIABLE_VALUE options

The value (item 4) can be:
- `STRING_LITERAL` — text value
- `NUMERIC_LITERAL` — number value
- `BOOLEAN_LITERAL` — boolean value
- `AFCOMPONENT` — value from a form field
- `FUNCTION_CALL` — value from function result
- `GET_VARIABLE` — value from another variable

> **Critical:** All 6 items must be present in exactly this order. The literal tokens `key`, `value`, and `on` must have `"value": null`.

---

## 6. GET_VARIABLE

Retrieve a stored variable. Used inside EXPRESSION (not as a standalone action).

**Items:** `["key", VARIABLE_NAME, "from", AFCOMPONENT]` — 4 items

```json
{
  "nodeName": "EXPRESSION",
  "choice": {
    "nodeName": "GET_VARIABLE",
    "items": [
      { "nodeName": "key", "value": null },
      {
        "nodeName": "STRING_LITERAL",
        "value": "userRole"
      },
      { "nodeName": "from", "value": null },
      {
        "nodeName": "AFCOMPONENT",
        "value": {
          "id": "$form",
          "displayName": "Form",
          "type": "FORM",
          "isDuplicate": false,
          "displayPath": "FORM/",
          "name": "form",
          "parent": "",
          "metadata": {}
        }
      }
    ]
  }
}
```

### Using GET_VARIABLE inside SET_VALUE_STATEMENT

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SET_VALUE_STATEMENT",
    "items": [
      {
        "nodeName": "VALUE_FIELD",
        "value": {
          "id": "$form.panel1.roleDisplay",
          "displayName": "roleDisplay",
          "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
          "isDuplicate": false,
          "displayPath": "FORM/panel1/",
          "name": "roleDisplay",
          "parent": "$form.panel1",
          "metadata": {}
        }
      },
      { "nodeName": "to", "value": null },
      {
        "nodeName": "EXPRESSION",
        "choice": {
          "nodeName": "GET_VARIABLE",
          "items": [
            { "nodeName": "key", "value": null },
            { "nodeName": "STRING_LITERAL", "value": "userRole" },
            { "nodeName": "from", "value": null },
            {
              "nodeName": "AFCOMPONENT",
              "value": {
                "id": "$form",
                "displayName": "Form",
                "type": "FORM",
                "isDuplicate": false,
                "displayPath": "FORM/",
                "name": "form",
                "parent": "",
                "metadata": {}
              }
            }
          ]
        }
      }
    ]
  }
}
```

---

## 7. DISPATCH_EVENT

Fire a custom event on a component. **3 items** in order.

**Items:** `[STRING_LITERAL, "on", AFCOMPONENT]`

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "DISPATCH_EVENT",
    "items": [
      { "nodeName": "STRING_LITERAL", "value": "custom:paymentComplete" },
      { "nodeName": "on", "value": null },
      {
        "nodeName": "AFCOMPONENT",
        "value": {
          "id": "$form",
          "displayName": "Form",
          "type": "FORM",
          "isDuplicate": false,
          "displayPath": "FORM/",
          "name": "form",
          "parent": "",
          "metadata": {}
        }
      }
    ]
  }
}
```

### Listening for the event

On the receiver side, use the custom event name as the TRIGGER_EVENT:

```json
{
  "nodeName": "TRIGGER_EVENT",
  "value": "custom:paymentComplete"
}
```

> **Cross-fragment communication:** Dispatch events on `globals.form` (the form root). Any component in the entire form tree — parent, sibling fragments, nested children — can listen for events dispatched on the form root.

---

## 8. FUNCTION_CALL

Call a custom or OOTB function. Uses `functionName` (object) + `params` (array). **NOT** `value.args`.

### As a BLOCK_STATEMENT action (void return / side effects)

When FUNCTION_CALL is a direct action (not returning a value to set), `parentNodeName` is `"BLOCK_STATEMENT"`:

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "FUNCTION_CALL",
    "parentNodeName": "BLOCK_STATEMENT",
    "functionName": {
      "id": "handleSubmission",
      "displayName": "Handle Submission",
      "type": "STRING",
      "isDuplicate": false,
      "displayPath": "",
      "args": [
        { "type": "STRING", "name": "formData", "description": "The form data", "isMandatory": true },
        { "type": "AFCOMPONENT", "name": "statusField", "description": "Status display", "isMandatory": true }
      ],
      "impl": "$0($1, $2)"
    },
    "params": [
      {
        "nodeName": "EXPRESSION",
        "choice": {
          "nodeName": "COMPONENT",
          "value": {
            "id": "$form.panel1.formDataField",
            "displayName": "formDataField",
            "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
            "isDuplicate": false,
            "displayPath": "FORM/panel1/",
            "name": "formDataField",
            "parent": "$form.panel1",
            "metadata": {}
          }
        }
      },
      {
        "nodeName": "EXPRESSION",
        "choice": {
          "nodeName": "COMPONENT",
          "value": {
            "id": "$form.panel1.statusField",
            "displayName": "statusField",
            "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
            "isDuplicate": false,
            "displayPath": "FORM/panel1/",
            "name": "statusField",
            "parent": "$form.panel1",
            "metadata": {}
          }
        }
      }
    ]
  }
}
```

### As an EXPRESSION (returning a value)

When FUNCTION_CALL is inside an EXPRESSION (e.g., as the value source in SET_VALUE_STATEMENT), `parentNodeName` is `"EXPRESSION"`:

```json
{
  "nodeName": "EXPRESSION",
  "choice": {
    "nodeName": "FUNCTION_CALL",
    "parentNodeName": "EXPRESSION",
    "functionName": {
      "id": "concat",
      "displayName": "Concatenate",
      "type": "STRING",
      "isDuplicate": false,
      "displayPath": "",
      "args": [
        { "type": "STRING", "name": "str1", "description": "First string", "isMandatory": true },
        { "type": "STRING", "name": "str2", "description": "Second string", "isMandatory": true }
      ],
      "impl": "$0($1, $2)"
    },
    "params": [
      {
        "nodeName": "EXPRESSION",
        "choice": { "nodeName": "STRING_LITERAL", "value": "Hello, " }
      },
      {
        "nodeName": "EXPRESSION",
        "choice": {
          "nodeName": "COMPONENT",
          "value": {
            "id": "$form.panel1.nameField",
            "displayName": "nameField",
            "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
            "isDuplicate": false,
            "displayPath": "FORM/panel1/",
            "name": "nameField",
            "parent": "$form.panel1",
            "metadata": {}
          }
        }
      }
    ]
  }
}
```

### parentNodeName rules

| Context | parentNodeName value |
|---------|---------------------|
| Direct action in BLOCK_STATEMENT | `"BLOCK_STATEMENT"` |
| Value source in EXPRESSION | `"EXPRESSION"` |
| Value source in EXTENDED_EXPRESSION | `"EXTENDED_EXPRESSION"` |
| Inside VARIABLE_VALUE | `"VARIABLE_VALUE"` |
| Inside VARIABLE_NAME | `"VARIABLE_NAME"` |
| Inside NAVIGATE_TO_EXPRESSION | `"NAVIGATE_TO_EXPRESSION"` |

### functionName.impl pattern

The `impl` field uses positional placeholders:
- `$0` = the function name itself
- `$1`, `$2`, ... = the parameters in order

Examples:
- 1 param: `"$0($1)"`
- 2 params: `"$0($1, $2)"`
- 3 params: `"$0($1, $2, $3)"`

### Function with no parameters

```json
{
  "nodeName": "FUNCTION_CALL",
  "parentNodeName": "EXPRESSION",
  "functionName": {
    "id": "today",
    "displayName": "Today's Date",
    "type": "DATE",
    "isDuplicate": false,
    "displayPath": "",
    "args": [],
    "impl": "$0()"
  },
  "params": []
}
```

> **Critical:** Always use `params` array for parameters. NEVER put arguments inside `functionName.args` at runtime — `args` is only the function signature definition.

---

## 9. NAVIGATE_TO

Navigate to a URL. **3 items** in order.

**Items:** `[NAVIGATE_TO_EXPRESSION, "in", NAVIGATE_METHOD_OPTIONS]`

### Navigate to a literal URL

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "NAVIGATE_TO",
    "items": [
      {
        "nodeName": "URL_LITERAL",
        "value": "https://example.com/thank-you"
      },
      { "nodeName": "in", "value": null },
      {
        "nodeName": "NEW_TAB",
        "value": null
      }
    ]
  }
}
```

### NAVIGATE_TO_EXPRESSION options

| Option | Use When |
|--------|----------|
| `URL_LITERAL` | Direct URL string (`"https://..."`) |
| `COMPONENT` | URL stored in a form field |
| `FUNCTION_CALL` | URL constructed by a function |

### NAVIGATE_METHOD_OPTIONS

| Option | Opens In |
|--------|----------|
| `NEW_WINDOW` | New browser window |
| `NEW_TAB` | New browser tab |
| `SAME_TAB` | Current tab (replaces page) |

### Navigate to URL from a field value

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "NAVIGATE_TO",
    "items": [
      {
        "nodeName": "COMPONENT",
        "value": {
          "id": "$form.panel1.redirectUrl",
          "displayName": "redirectUrl",
          "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
          "isDuplicate": false,
          "displayPath": "FORM/panel1/",
          "name": "redirectUrl",
          "parent": "$form.panel1",
          "metadata": {}
        }
      },
      { "nodeName": "in", "value": null },
      { "nodeName": "SAME_TAB", "value": null }
    ]
  }
}
```

---

## 10. NAVIGATE_IN_PANEL

Navigate within a wizard or tabbed panel. **3 items** in order.

**Items:** `[PANEL_FOCUS_OPTION, "of", PANEL]`

### Go to next panel step

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "NAVIGATE_IN_PANEL",
    "items": [
      { "nodeName": "NEXT_ITEM", "value": null },
      { "nodeName": "of", "value": null },
      {
        "nodeName": "PANEL",
        "value": {
          "id": "$form.wizardPanel",
          "displayName": "wizardPanel",
          "type": "AFCOMPONENT|PANEL",
          "name": "wizardPanel",
          "parent": "$form"
        }
      }
    ]
  }
}
```

### PANEL_FOCUS_OPTION values

| Option | Direction |
|--------|-----------|
| `NEXT_ITEM` | Go to next panel/tab |
| `PREVIOUS_ITEM` | Go to previous panel/tab |
| `FIRST_ITEM` | Go to first panel/tab |

### Go to previous panel step

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "NAVIGATE_IN_PANEL",
    "items": [
      { "nodeName": "PREVIOUS_ITEM", "value": null },
      { "nodeName": "of", "value": null },
      {
        "nodeName": "PANEL",
        "value": {
          "id": "$form.wizardPanel",
          "displayName": "wizardPanel",
          "type": "AFCOMPONENT|PANEL",
          "name": "wizardPanel",
          "parent": "$form"
        }
      }
    ]
  }
}
```

---

## 11. SET_PROPERTY

Set a property of a component. **3 items** in order.

**Items:** `[MEMBER_EXPRESSION, "to", EXTENDED_EXPRESSION]`

### Set a field's label

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SET_PROPERTY",
    "items": [
      {
        "nodeName": "MEMBER_EXPRESSION",
        "items": [
          {
            "nodeName": "PROPERTY_LIST",
            "value": { "displayName": "label" }
          },
          { "nodeName": "of", "value": null },
          {
            "nodeName": "COMPONENT",
            "value": {
              "id": "$form.panel1.emailField",
              "displayName": "emailField",
              "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
              "isDuplicate": false,
              "displayPath": "FORM/panel1/",
              "name": "emailField",
              "parent": "$form.panel1",
              "metadata": {}
            }
          }
        ]
      },
      { "nodeName": "to", "value": null },
      {
        "nodeName": "EXTENDED_EXPRESSION",
        "choice": {
          "nodeName": "STRING_LITERAL",
          "value": "Work Email Address"
        }
      }
    ]
  }
}
```

### Make a field required

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SET_PROPERTY",
    "items": [
      {
        "nodeName": "MEMBER_EXPRESSION",
        "items": [
          {
            "nodeName": "PROPERTY_LIST",
            "value": { "displayName": "required" }
          },
          { "nodeName": "of", "value": null },
          {
            "nodeName": "COMPONENT",
            "value": {
              "id": "$form.panel1.phoneField",
              "displayName": "phoneField",
              "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
              "isDuplicate": false,
              "displayPath": "FORM/panel1/",
              "name": "phoneField",
              "parent": "$form.panel1",
              "metadata": {}
            }
          }
        ]
      },
      { "nodeName": "to", "value": null },
      {
        "nodeName": "EXTENDED_EXPRESSION",
        "choice": {
          "nodeName": "BOOLEAN_LITERAL",
          "choice": { "nodeName": "True", "value": null }
        }
      }
    ]
  }
}
```

### PROPERTY_LIST — Available properties by component type

| Property | Value Type | Description | Applicable To |
|----------|-----------|-------------|---------------|
| `visible` | BOOLEAN | Show/hide component | All components |
| `enabled` | BOOLEAN | Enable/disable interaction | All components |
| `label` | STRING | Field label text | All field types |
| `placeholder` | STRING | Placeholder text | Text inputs, dropdowns |
| `required` | BOOLEAN | Make field mandatory | All field types |
| `value` | varies | Field value | All field types |
| `readOnly` | BOOLEAN | Make field read-only | All field types |

> **Note:** For simple visibility/enabled toggling, prefer SHOW_STATEMENT/HIDE_STATEMENT/ENABLE_STATEMENT/DISABLE_STATEMENT over SET_PROPERTY. Use SET_PROPERTY only when you need to set properties like `label`, `placeholder`, or `required`.

---

## Additional Action Types

### SUBMIT_FORM

Submit the form. **No items** — empty items array.

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SUBMIT_FORM",
    "items": []
  }
}
```

### RESET_FORM

Reset form, panel, or field. Takes a single AFCOMPONENT.

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "RESET_FORM",
    "items": [
      {
        "nodeName": "AFCOMPONENT",
        "value": {
          "id": "$form",
          "displayName": "Form",
          "type": "FORM",
          "isDuplicate": false,
          "displayPath": "FORM/",
          "name": "form",
          "parent": "",
          "metadata": {}
        }
      }
    ]
  }
}
```

### VALIDATE_FORM

Validate form, panel, or field. Takes a single AFCOMPONENT.

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "VALIDATE_FORM",
    "items": [
      {
        "nodeName": "AFCOMPONENT",
        "value": {
          "id": "$form.panel1",
          "displayName": "panel1",
          "type": "AFCOMPONENT|PANEL",
          "isDuplicate": false,
          "displayPath": "FORM/",
          "name": "panel1",
          "parent": "$form",
          "metadata": {}
        }
      }
    ]
  }
}
```

### SAVE_FORM

Save the form. **No items** — empty items array.

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SAVE_FORM",
    "items": []
  }
}
```

### SET_FOCUS

Set focus to a component. **2 items:** `"to"` literal + AFCOMPONENT.

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "SET_FOCUS",
    "items": [
      { "nodeName": "to", "value": null },
      {
        "nodeName": "AFCOMPONENT",
        "value": {
          "id": "$form.panel1.nameField",
          "displayName": "nameField",
          "type": "AFCOMPONENT",
          "isDuplicate": false,
          "displayPath": "FORM/panel1/",
          "name": "nameField",
          "parent": "$form.panel1",
          "metadata": {}
        }
      }
    ]
  }
}
```

### ADD_INSTANCE / REMOVE_INSTANCE

Add or remove an instance of a repeatable panel. **2 items:** `"of"` literal + REPEATABLE_COMPONENT.

```json
{
  "nodeName": "BLOCK_STATEMENT",
  "choice": {
    "nodeName": "ADD_INSTANCE",
    "items": [
      { "nodeName": "of", "value": null },
      {
        "nodeName": "REPEATABLE_COMPONENT",
        "value": {
          "id": "$form.addressList",
          "displayName": "addressList",
          "type": "AFCOMPONENT",
          "name": "addressList",
          "parent": "$form"
        }
      }
    ]
  }
}
```

REMOVE_INSTANCE is identical — just change `"nodeName": "REMOVE_INSTANCE"`.

---

## Complete Rule Example

A full rule combining multiple concepts: "When submitButton is clicked, if nameField is not empty, then set greeting to concat(nameField) and show successPanel, else show errorPanel."

```json
{
  "nodeName": "ROOT",
  "isValid": true,
  "enabled": true,
  "eventName": "Submit with Greeting",
  "items": [
    {
      "nodeName": "STATEMENT",
      "choice": {
        "nodeName": "TRIGGER_SCRIPTS",
        "items": [
          {
            "nodeName": "SINGLE_TRIGGER_SCRIPTS",
            "items": [
              {
                "nodeName": "COMPONENT",
                "value": {
                  "id": "$form.panel1.submitButton",
                  "displayName": "submitButton",
                  "type": "AFCOMPONENT",
                  "isDuplicate": false,
                  "displayPath": "FORM/panel1/",
                  "name": "submitButton",
                  "parent": "$form.panel1",
                  "metadata": {}
                }
              },
              {
                "nodeName": "TRIGGER_EVENT",
                "value": "is clicked"
              },
              { "nodeName": "When", "value": null },
              {
                "nodeName": "TRIGGER_EVENT_SCRIPTS",
                "items": [
                  {
                    "nodeName": "CONDITION",
                    "nested": false,
                    "choice": {
                      "nodeName": "COMPARISON_EXPRESSION",
                      "items": [
                        {
                          "nodeName": "EXPRESSION",
                          "choice": {
                            "nodeName": "COMPONENT",
                            "value": {
                              "id": "$form.panel1.nameField",
                              "displayName": "nameField",
                              "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
                              "isDuplicate": false,
                              "displayPath": "FORM/panel1/",
                              "name": "nameField",
                              "parent": "$form.panel1",
                              "metadata": {}
                            }
                          }
                        },
                        {
                          "nodeName": "OPERATOR",
                          "choice": { "nodeName": "IS_NOT_EMPTY", "value": null }
                        }
                      ]
                    }
                  },
                  { "nodeName": "Then", "value": null },
                  {
                    "nodeName": "BLOCK_STATEMENTS",
                    "items": [
                      {
                        "nodeName": "BLOCK_STATEMENT",
                        "choice": {
                          "nodeName": "SET_VALUE_STATEMENT",
                          "items": [
                            {
                              "nodeName": "VALUE_FIELD",
                              "value": {
                                "id": "$form.panel1.greeting",
                                "displayName": "greeting",
                                "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
                                "isDuplicate": false,
                                "displayPath": "FORM/panel1/",
                                "name": "greeting",
                                "parent": "$form.panel1",
                                "metadata": {}
                              }
                            },
                            { "nodeName": "to", "value": null },
                            {
                              "nodeName": "EXPRESSION",
                              "choice": {
                                "nodeName": "FUNCTION_CALL",
                                "parentNodeName": "EXPRESSION",
                                "functionName": {
                                  "id": "concat",
                                  "displayName": "Concatenate",
                                  "type": "STRING",
                                  "isDuplicate": false,
                                  "displayPath": "",
                                  "args": [
                                    { "type": "STRING", "name": "str1", "description": "First string", "isMandatory": true },
                                    { "type": "STRING", "name": "str2", "description": "Second string", "isMandatory": true }
                                  ],
                                  "impl": "$0($1, $2)"
                                },
                                "params": [
                                  {
                                    "nodeName": "EXPRESSION",
                                    "choice": { "nodeName": "STRING_LITERAL", "value": "Hello, " }
                                  },
                                  {
                                    "nodeName": "EXPRESSION",
                                    "choice": {
                                      "nodeName": "COMPONENT",
                                      "value": {
                                        "id": "$form.panel1.nameField",
                                        "displayName": "nameField",
                                        "type": "AFCOMPONENT|FIELD|TEXT FIELD|STRING",
                                        "isDuplicate": false,
                                        "displayPath": "FORM/panel1/",
                                        "name": "nameField",
                                        "parent": "$form.panel1",
                                        "metadata": {}
                                      }
                                    }
                                  }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      {
                        "nodeName": "BLOCK_STATEMENT",
                        "choice": {
                          "nodeName": "SHOW_STATEMENT",
                          "items": [
                            {
                              "nodeName": "AFCOMPONENT",
                              "value": {
                                "id": "$form.successPanel",
                                "displayName": "successPanel",
                                "type": "AFCOMPONENT|PANEL",
                                "isDuplicate": false,
                                "displayPath": "FORM/",
                                "name": "successPanel",
                                "parent": "$form",
                                "metadata": {}
                              }
                            }
                          ]
                        }
                      }
                    ]
                  },
                  { "nodeName": "Else", "value": null },
                  {
                    "nodeName": "BLOCK_STATEMENTS",
                    "items": [
                      {
                        "nodeName": "BLOCK_STATEMENT",
                        "choice": {
                          "nodeName": "SHOW_STATEMENT",
                          "items": [
                            {
                              "nodeName": "AFCOMPONENT",
                              "value": {
                                "id": "$form.errorPanel",
                                "displayName": "errorPanel",
                                "type": "AFCOMPONENT|PANEL",
                                "isDuplicate": false,
                                "displayPath": "FORM/",
                                "name": "errorPanel",
                                "parent": "$form",
                                "metadata": {}
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

---

## Quick Reference: Items Count by Action Type

| Action | Items Count | Items Pattern |
|--------|-------------|---------------|
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
| GET_VARIABLE | 4 | `["key", VARIABLE_NAME, "from", AFCOMPONENT]` |
| FUNCTION_CALL | n/a | `functionName` + `params` (no items array) |
| SUBMIT_FORM | 0 | `[]` |
| SAVE_FORM | 0 | `[]` |
| RESET_FORM | 1 | `[AFCOMPONENT]` |
| VALIDATE_FORM | 1 | `[AFCOMPONENT]` |