---
name: logic-plan
description: >
  Plan type reference for logic plans. Adds cross-cutting validations and
  business rules that span multiple fields or panels.
type: plan-type
---

# Logic Plan

Adds cross-cutting validations and business rules that span multiple fields or panels.

---

## Overview

| Attribute | Value |
|-----------|-------|
| **Primary skills** | `add-rules`, `create-function` |
| **Specification focus** | Validation rule tables (trigger fields, condition, error message, display method), custom function signatures with parameters and return types, algorithm pseudocode |
| **Typical steps** | Create custom functions → wire validation rules to trigger fields → unit test edge cases → validate → push |
| **Example** | Plan 05: Cross-field Business Rule Validations |

---

## Characteristics

- Depends on multiple earlier plans (fields must exist before rules can reference them)
- Creates reusable custom functions (e.g., `validateDateRange`, `validateThreshold`)
- Documents edge cases and boundary conditions explicitly
- Often includes a unit test step for custom functions

---

## Specification Patterns

A logic plan's specification section typically includes the following subsections.

### Validation Rules

Define each validation as a row in a trigger/condition/action table:

| Trigger Fields | Condition | Error Message | Display As |
|---------------|-----------|---------------|------------|
| fieldA OR fieldB | fieldA > fieldB | "A cannot exceed B" | Toast |
| dateOfBirth | age < 18 | "Must be 18 or older" | Inline |

**Guidelines:**
- **Trigger fields** — list every field whose `fd:change` event should fire this validation
- **Condition** — express in plain logic (no code); use field names from the form.json
- **Error message** — exact string the user sees
- **Display as** — `Toast`, `Inline` (field-level), or `Modal`

### Custom Functions

Catalog every function this plan creates:

| Function Name | Purpose | Parameters | Returns |
|---------------|---------|------------|---------|
| validateDateRange | Cross-field: end date must be after start date | `startDate`, `endDate`, `errorMsg` | void (shows toast on failure) |
| validateThreshold | Range check based on category | `value`, `category` | void (shows toast on failure) |
| validateRatio | Ratio cannot exceed configured limit | `numerator`, `denominator` | void (shows toast on failure) |

**Guidelines:**
- Functions should be reusable across multiple trigger fields
- Sync wrappers with async `*Helper` pattern when `globals` access is needed
- Document all edge cases (null values, zero values, type coercion)

### Algorithm Pseudocode

For non-trivial logic, include pseudocode:

```
Input:  startDate, endDate
Output: validation result

Algorithm:
  if endDate <= startDate:
    showErrorToast("End date must be after start date")
    return false
  return true
```

---

## Typical Steps to Execute

1. **Create custom functions** using `create-function`:
   - Write each function in the fragment script
   - Add sync exported wrapper + async helper (if using `globals`)
   - Re-export from form-level script with JSDoc stubs

2. **Wire validation rules** using `add-rules`:
   - For each trigger field, create a rule that calls the custom function on `fd:change`
   - Validate rule JSON with `rule_coder.validator`
   - Save rule to store with `save-rule.js`

3. **Test edge cases:**
   - Null/empty field values
   - Boundary conditions (exactly at threshold)
   - Multiple triggers firing in sequence

4. **Validate:**
   ```
   node tools/eds-form-validator/validate.cjs <path-to-form.json> code/authoring/_form.json
   ```

5. **Push to AEM:**
   ```
   form-sync push <aem-content-path>
   ```

---

## Dependencies

Logic plans typically depend on:
- **Structure plan** — all panels and fields must exist
- **Workflow plans** — branch-specific fields must be in place before cross-field rules can reference them

Logic plans are typically depended on by:
- **Integration plans** — API response handling may reuse validation functions
- **Infrastructure plans** — error handling may wrap validation error display