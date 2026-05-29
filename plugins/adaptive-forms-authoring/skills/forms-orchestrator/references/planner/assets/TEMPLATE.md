---
name: plan-template
description: >
  Use when writing a new plan file for a journey. Provides the plan schema,
  conventions, and specification patterns for each plan type.
type: template
---

# Plan Template

Standard structure for plan files. Copy the template below when creating a new plan.

> **File path convention:** `journeys/<journey>/plans/NN-<short-title>.md`

---

## Template

````
# Plan NN: <Plan Title>

**Type:** <Custom Component | Screen | Interaction Flow | Functional Rules | Complex Rules | Validation | Integration | Submit | QA>
**Source:** `journeys/<journey>/spec.md` sections <X>, <Y>
**Skills:** `<skill-1>`, `<skill-2>`
**Depends on:** Plan <NN> (<what it provides>) — or "Nothing (first plan)"

---

## Objective

<One paragraph: what this plan delivers and why.>

## Specification

<Detailed design — see plan type patterns below.>

## Steps to Execute

1. **<Action verb> <artifact>** using `<skill-name>`:
   <What to create/modify and how>

2. **Verify acceptance criteria** — run checks at end of plan, not after each step.

## Acceptance Criteria

- [ ] <Specific observable behavior>
- [ ] Form loads without console errors
- [ ] No regressions in previously implemented plans

## Notes

<Optional: known issues, deferred items, edge cases. Remove if not needed.>
````

---

## Conventions

| Rule | Description |
|---|---|
| **Scope** | One plan = one functional concern. Mixed concerns → split. |
| **Screen plans = structure only** | Fields + layout + CSS. No rules, no APIs, no navigation wiring in Screen plans. |
| **Cross-skill** | A plan may invoke multiple skills. Plans are scoped by *feature*, not by *skill*. |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10`, `11`. |
| **Execution** | Sequential — each plan declares its dependencies via `Depends on`. |
| **Max per journey** | 15 plans. If more needed, journey is too complex — decompose it. |
| **File path** | `journeys/<journey>/plans/NN-<short-title>.md` |
| **Acceptance criteria** | Required in every plan. Every criterion must be independently testable. |
| **API reference** | Integration plans read `refs/apis/<name>.<ext>` — do not duplicate API schema inline. |

---

## Plan Types

### Custom Component

Builds a new `fd:viewType` block renderer before Screen plans that use it.

**Specification Pattern:**

```
### Component: <fd:viewType>

- Base type: <fieldType> (e.g., radio-group, number-input, panel)
- Files: blocks/form/components/<fd:viewType>/

### Scaffold

npm run create:custom-component -- --name <fd:viewType> --base <base-type>

### Registration

Add '<fd:viewType>' to customComponents array in blocks/form/mappings.js

### Implementation Notes

- <Key decorate() behavior>
- <subscribe pattern: listenChanges: true>
- <State classes or CSS variables used>
```

**Typical Steps:**
1. Scaffold component using `forms-custom-components`
2. Register in `mappings.js`
3. Implement `decorate()` with subscribe wiring
4. Write `<fd:viewType>.css` scoped to `.<fd:viewType>-wrapper`
5. Verify: set `fd:viewType` on a test field → component renders

---

### Screen

Builds one wizard step — all fields, layout, CSS. No rules, no APIs, no navigation wiring.

**Specification Pattern:**

```
### Panel Structure

wizardPanel
└── screen-01-<name> (panelcontainer)
    ├── field_a  (text-input)
    ├── field_b  (drop-down)
    └── field_c  (card-choice — fd:viewType)

### Field Specifications

| Field | Type / fd:viewType | Required | Placeholder | Notes |
|---|---|---|---|---|
| field_a | text-input | yes | Full name | — |
| field_b | drop-down | yes | — | Options: A, B, C |
| field_c | card-choice | yes | — | Custom component |

### Layout / CSS Notes

<Any CSS class or layout specifics — column count, spacing>
```

**Typical Steps:**
1. Add wizard panel step using `forms-author`
2. Add fields using `forms-author` + `forms-content-modeler`
3. Verify: screen renders all fields, no console errors

---

### Interaction Flow

Wires wizard navigation and conditional step progression. Depends on all Screen plans.

**Specification Pattern:**

```
### Wizard Navigation

| From Screen | To Screen | Condition |
|---|---|---|
| screen-01 | screen-02 | always (Next button click) |
| screen-02 | screen-03 | field_x = "yes" |
| screen-02 | screen-04 | field_x != "yes" (skip screen-03) |

### Back Navigation

All screens: Back button returns to previous screen unconditionally.
```

**Typical Steps:**
1. Wire Next/Back rules using `forms-rule-author`
2. Implement conditional skip logic
3. Verify: navigate through all screens in happy path and skip path

---

### Functional Rules

Show/hide, enable/disable, set-value rules. Depends on all Screen plans.

**Specification Pattern:**

```
### Rules

| Trigger Field | Condition | Action | Target |
|---|---|---|---|
| has_spouse | value = "yes" | show | spouse_name |
| country | value != "US" | hide | state_field |
| plan_type | changes | set value "" | coverage_amount |
```

**Typical Steps:**
1. Implement rules using `forms-rule-author`
2. Verify each rule: trigger → expected outcome

---

### Complex Rules

Calculations and derived values. Depends on Functional Rules (if any).

**Specification Pattern:**

```
### Calculations

| Output Field | Formula | Input Fields |
|---|---|---|
| total_premium | base_rate × coverage_amount | base_rate, coverage_amount |
| discount | IF age > 60 THEN 0.1 ELSE 0 | age |
```

**Typical Steps:**
1. Implement calculate expressions using `forms-rule-author`
2. Verify: change inputs → output updates correctly

---

### Validation

Field constraints and cross-field validation. Depends on Screen plans.

**Specification Pattern:**

```
### Field Validations

| Field | Rule | Error Message |
|---|---|---|
| email | email format | Enter a valid email address |
| dob | date in past | Date of birth must be in the past |

### Cross-Field Validations

| Condition | Error Message | Display |
|---|---|---|
| confirm_email ≠ email | Emails must match | Inline on confirm_email |
| end_date < start_date | End date must be after start date | Toast |
```

**Typical Steps:**
1. Add validate expressions using `forms-rule-author`
2. Add cross-field validation functions
3. Verify: invalid input → correct error shown; valid input → no error

---

### Integration

API wiring — prefill on load, mid-flow service calls. Read `refs/apis/<name>.<ext>` for schema details.

**Specification Pattern:**

```
### APIs

| API | Ref | Trigger | Response → Form Mapping | On Error |
|---|---|---|---|---|
| address-lookup | refs/apis/address-lookup.yaml | postcode field change | response.street → form.street | show "Address not found" |
| user-prefill | refs/apis/user-prefill.json | form load | response.firstName → form.first_name | silent |

### Custom Function Signatures

| Function | Purpose | Params |
|---|---|---|
| fetchAddressLookup | Call address API on postcode change | postcode, globals |
| prefillUserDetails | Call prefill API on form load | globals |
```

**Typical Steps:**
1. Register/sync API using `forms-integration` → `manage-apis`
2. Generate JS client (`api-manager build`)
3. Create custom function wrappers using `forms-rule-author`
4. Wire triggers: field change / form load → custom function call
5. Verify: trigger fires → response prefills correct fields; error → correct message shown

---

### Submit

Submit action configuration and success/error handling.

**Specification Pattern:**

```
### Submit Action

- Endpoint: POST /api/submit
- Trigger: Submit button click
- Payload: { field_a: form.field_a, field_b: form.field_b, ... }

### Success State

<Show "Thank you" message text> | <Redirect to /thank-you>

### Error State

Show "<error message>" — do not clear form
```

**Typical Steps:**
1. Configure submit action using `forms-author`
2. Implement success handler (message or redirect)
3. Implement error handler (user message, form preserved)
4. Verify: submit → success state shown; API error → error message shown

---

### QA

Thin final plan — lint + full journey smoke test + cross-plan regression. No new implementation.

**Specification Pattern:**

```
### Checks

1. npm run lint in $FORMS_EDS_ROOT — zero errors
2. Full journey walkthrough: all screens, happy path, submit
3. All acceptance criteria from all preceding plans
```

**Typical Steps:**
1. Run `npm run lint` — fix any violations before marking done
2. Walk through full journey: all screens → submit → verify success state
3. Spot-check acceptance criteria from each preceding plan
