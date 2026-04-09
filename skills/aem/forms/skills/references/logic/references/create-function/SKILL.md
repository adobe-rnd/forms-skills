---
name: create-function
description: >
  Creates AEM Forms custom JavaScript functions with proper JSDoc annotations for the
  visual rule editor. Handles async API patterns, form-level composition, fragment
  re-exports, scope/globals usage, and parser compatibility. Use for calculations,
  API calls, data transformations, or complex multi-field logic. NOT for simple
  show/hide or enable/disable (use add-rules skill with direct actions instead).
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
allowed-tools: Read, Write, Edit, Bash
---

# Custom Function Implementation

Create JavaScript functions for AEM Adaptive Forms rule expressions.

## When to Use

- User needs custom business logic as a reusable function
- Calculations, validations, API calls, data transformations
- Complex multi-field logic that can't be done with simple rule actions

**Do NOT use for:** Simple show/hide, enable/disable, set value — use the **add-rules** skill with direct action statements instead.

## Critical Rule: No DOM Access

Custom functions ONLY interact with the form model via `globals`/`scope`.

| ❌ Don't | ✅ Do |
|----------|-------|
| `document.querySelector(...)` | `globals.form.panel.field.$value` |
| `element.classList.add(...)` | `globals.functions.setProperty(field, {...})` |
| `new CustomEvent(...)` | `globals.functions.dispatchEvent(target, "custom:event")` |
| `fetch(url)` | `globals.functions.request({url, method, body})` |

## Function Format

### Required Pattern: Declaration + Export

```javascript
import { someHelper } from './libs.js';

/**
 * Brief description
 * @name myFunction My Function Display Name
 * @param {string} param - Parameter description
 * @param {scope} globals - Globals object
 */
function myFunction(param, globals) {
    // implementation
}

export { myFunction };
```

### CRITICAL: Export Limitation

```javascript
// ❌ DOES NOT WORK - Parser returns empty array
export function myFunction(param) { return param; }

// ✅ WORKS - Regular function + export at end
function myFunction(param) { return param; }
export { myFunction };
```

### NOT Supported as Exported Functions

- `export function` (inline export)
- `async function` (won't appear in visual rule editor)
- Generator functions, class methods, rest parameters

## Async Pattern: Helper + Sync Wrapper

```javascript
// ✅ Internal helper (CAN use async/await)
async function fetchHelper(custId, globals) {
    const response = await globals.functions.request({
        url: '/api/' + custId,
        method: 'GET'
    });
    if (!response.ok) throw new Error('Failed');
    return response.body;
}

// ✅ Exported function (MUST be sync for rule editor)
/**
 * @name fetchCustomer Fetch Customer
 * @param {string} custId - Customer ID
 * @param {scope} globals - Globals object
 */
function fetchCustomer(custId, globals) {
    fetchHelper(custId, globals)
        .then(function(data) {
            globals.functions.setProperty(globals.form.name, { value: data.name });
        })
        .catch(function(err) { console.error(err); });
}

export { fetchCustomer };
```

**Key rules:**
- **Exported functions** (with JSDoc `@name`) **MUST be sync** — async won't appear in rule editor
- **Helper functions** (internal) **CAN use async/await**
- Always use `globals.functions.request()` — NEVER use `fetch()` directly

## Form-Level Composition (CRITICAL)

AEM runtime loads ONLY the form-level script. Fragment scripts are authoring-only.

### File Layout

```
code/blocks/form/scripts/
├── form/
│   └── my-form.js          ← Loaded by AEM runtime
├── fragment/
│   ├── fragment-a.js        ← Authoring only
│   └── fragment-b.js        ← Authoring only
└── script-libs/
    └── libs.js              ← Shared utilities
```

### Pattern: Re-Export Fragment Functions

```javascript
// form/my-form.js
import { handleBankClick } from '../fragment/chooseall.js';
import { handleAccountRadio } from '../fragment/etbaccountselection.js';

/**
 * @name formInit Form Init
 * @param {scope} globals - Globals object
 */
function formInit(globals) { /* form-level logic */ }

export {
  formInit,              // Form-level
  handleBankClick,       // Fragment: chooseall
  handleAccountRadio,    // Fragment: etbaccountselection
};
```

| Rule | Details |
|------|---------|
| Form script must re-export ALL fragment functions | Otherwise "Unknown function" errors at runtime |
| Use unique function names | Form and fragment functions must never share names |
| When adding new fragment functions | Always add re-export in form-level script |

## Fragment Functions: Pass Specific Fields

```javascript
// ❌ Fragment root doesn't appear in Form Object dropdown
function handle(fragment, globals) { ... }

// ✅ Pass specific fields as {object} parameters
/**
 * @name handleBankSelection Handle Bank Selection
 * @param {object} bankDropdown - Bank dropdown field
 * @param {object} hiddenBankName - Hidden field for bank name
 * @param {scope} globals - Globals object
 */
function handleBankSelection(bankDropdown, hiddenBankName, globals) {
    globals.functions.setProperty(hiddenBankName, { value: bankDropdown.$value });
    globals.functions.dispatchEvent(globals.form, 'custom:bankSelected');
}
```

**Cross-fragment:** child fragments CANNOT reference parent via `$parent`. Use events.

## JSDoc Reference

### Required Tags

| Tag | Example |
|-----|---------|
| Description | `/** Calculates total price */` |
| `@param` | `@param {string} name - User name` |
| `@returns` | `@returns {number} The calculated total` |
| `@name` | `@name calculateTotal Calculate Total Price` |

### Parameter Types

| JSDoc Type | AEM Type | Notes |
|------------|----------|-------|
| `string` | STRING | |
| `number` | NUMBER | |
| `boolean` | BOOLEAN | |
| `date` | DATE | |
| `object` | OBJECT/AFCOMPONENT | Form components (fields, panels) |
| `scope` | SCOPE | Globals — MUST be last argument |
| `string[]` | STRING[] | Array types supported |

Omit `@returns` for void functions.

## Tool Commands

| Tool | Command |
|------|---------|
| Parse functions | `parse-functions <path-to-js>` |
| List APIs | `api-manager list` |
| Show API details | `api-manager show <name> --json` |
| Build API clients | `api-manager build` |

## Best Practices

1. Always include JSDoc with description and param/return types
2. Use descriptive `@name` for rule editor discoverability
3. Validate inputs — check for null/undefined before processing
4. Keep functions focused — one function, one purpose
5. Use meaningful parameter names

## Additional Resources

- [references/api-patterns.md](references/api-patterns.md) — API integration patterns (api-clients, direct request, error handling)
- [references/implementation-patterns.md](references/implementation-patterns.md) — Code examples (calculations, validation, data transformation)
- [references/scope-functions-reference.md](references/scope-functions-reference.md) — Complete globals.functions API reference