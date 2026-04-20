---
name: plan-template
description: >
  Standard schema and template for plan files. Plans are sequentially ordered
  execution units within a journey. Each plan implements a scoped feature,
  workflow, or integration by invoking one or more skills.
type: template
---

# Plan Template

Standard structure for plan files. Copy this template when creating a new plan.

> **File path convention:** `plans/<journey>/NN-<short-title>.md`

---

## Template

````
# Plan NN: <Plan Title>

**Source:** `journeys/<journey>.md` sections <X.Y>, <X.Z>
<!-- Which sections of the journey/requirements doc does this plan implement? -->

**Sub-task:** <TICKET-ID> (<N> SP)
<!-- Optional: Jira/ticket ID and story points -->

**Skills:** `<skill-1>`, `<skill-2>`, `<skill-3>`
<!-- Which skills does this plan invoke? e.g. create-form, add-rules, create-function, manage-apis, create-component -->

**Depends on:** Plan <NN> (<what it provides>), Plan <NN> (<what it provides>)
<!-- Explicit dependency chain. Use "Nothing (first plan)" for the first plan. -->

---

## Objective

<!-- One paragraph: what does this plan achieve and why? Keep it concise. -->
<!-- Example: "Build the complete form skeleton with all panels and implement the personal information fields with their validations." -->

## Specification

<!-- The detailed design. Content varies by plan type — see Plan Types below. -->

<!-- FOR STRUCTURE PLANS: Panel hierarchy tree + field specification tables -->
<!--
### Panel Structure

```
rootPanel
├── panelA
│   ├── fieldA1        (text-input)
│   └── fieldA2        (drop-down)
└── panelB             (initially hidden)
    └── fieldB1        (number-input)
```

### Field Specifications

| Field | Type | Required | Min | Max | Pattern | Notes |
|-------|------|----------|-----|-----|---------|-------|
| fieldA1 | text-input | Yes | 2 | 30 | `^[A-Za-z]+$` | Auto-uppercase |
| fieldA2 | drop-down | Yes | — | — | — | Enum from API |
-->

<!-- FOR WORKFLOW PLANS: Branching logic tables showing triggers, conditions, and actions -->
<!--
### <Branch Name> Logic

| Component | Trigger | Condition | Actions |
|-----------|---------|-----------|---------|
| fieldX | is changed | value EQUALS "Y" | Show panelA, Hide panelB, Set fieldZ required = true |
| fieldX | is changed | value EQUALS "N" | Hide panelA, Show panelB, Clear fieldZ |
-->

<!-- FOR LOGIC PLANS: Validation rule tables, custom function signatures, algorithm pseudocode -->
<!--
### Validation Rules

| Trigger Fields | Condition | Error Message | Display As |
|---------------|-----------|---------------|------------|
| fieldA OR fieldB | fieldA > fieldB | "A cannot exceed B" | Toast |

### Custom Functions

| Function Name | Purpose | Parameters | Returns |
|---------------|---------|------------|---------|
| validateAvsB | Cross-field check | `a`, `b`, `errorMsg` | void (shows toast on failure) |

### Algorithm

```
Input:  fieldA, fieldB
Output: validation result

Algorithm:
  if fieldA > fieldB:
    showErrorToast(errorMsg)
    return false
  return true
```
-->

<!-- FOR INTEGRATION PLANS: API definitions, request/response mappings, prefill logic -->
<!--
### API Definition

| Property | Value |
|----------|-------|
| Endpoint | `/api/path/to/endpoint` |
| Method | POST |
| Content-Type | application/json |
| Trigger | On form load / On button click |

### Request Body

```json
{
  "param": "<value source>"
}
```

### Response Handling

| Response | Status | Action |
|----------|--------|--------|
| Success | 200 | Extract data → prefill form |
| Timeout | 401 | Clear session → show relogin |
| Error | 400 | Show error toast |

### Prefill Mapping

| API Field | Form Field | Transform |
|-----------|------------|-----------|
| `response.field_a` | fieldA | Direct |
| `response.date` | dateField | `convertDateApiToForm` |
-->

## Steps to Execute

<!-- Numbered, actionable steps. Each step should indicate which skill to invoke. -->

1. **<Action verb> <artifact>** using `<skill-name>`:
   <!-- Describe what to create/modify and how -->

2. **<Action verb> <artifact>** using `<skill-name>`:
   <!-- Describe wiring up rules, integrations, etc. -->

3. **Validate:**
   <!-- Always include a validation step -->
   ```
   node tools/eds-form-validator/validate.js <path-to-form.json>
   ```

4. **Push to AEM:**
   <!-- Always ASK before pushing — never push silently. Token may be expired. -->
   > "Ready to push to AEM? (yes / skip — you can push manually later with `form-sync push <aem-content-path>`)"
   - If **yes**: run `form-sync push <aem-content-path>` and confirm success.
   - If **no** / **skip**: note that push is pending and move on.

## Acceptance Criteria

<!-- Checklist of testable conditions. Each item should be independently verifiable. -->

- [ ] <Condition 1 — what should be true when this plan is done>
- [ ] <Condition 2 — specific field/panel/rule behavior>
- [ ] <Condition 3 — error case handled correctly>
- [ ] Form passes validation without errors
- [ ] Form renders on AEM without errors

## Notes

<!-- Optional: Known issues, deferred items, edge cases, dependency notes, links to related plans. -->
<!-- Remove this section if not needed. -->

<!-- Example: "This plan provides infrastructure functions used by Plans 07–09. -->
<!-- Build order may differ from plan number — see dependency chain." -->
````

---

## Plan Types

Common plan patterns observed across production journeys. A plan's type is not declared explicitly — it emerges from which specification sections and skills the plan uses.

Each type has its own detailed reference with specification patterns, typical steps, and examples. The planner uses these references when generating plans.

| Type | Purpose | Primary Skills | Reference |
|------|---------|----------------|-----------|
| **Structure** | Form skeleton — panels, fields, basic validations | `create-form`, `scaffold-form` | [`references/structure-plan.md`](../references/structure-plan.md) |
| **Workflow** | Specific user flow or conditional branch | `create-form`, `add-rules`, `create-function` | [`references/workflow-plan.md`](../references/workflow-plan.md) |
| **Logic** | Cross-cutting validations and business rules | `add-rules`, `create-function` | [`references/logic-plan.md`](../references/logic-plan.md) |
| **Integration** | API wiring — data loading, save/submit, external calls | `manage-apis`, `create-function`, `add-rules` | [`references/integration-plan.md`](../references/integration-plan.md) |
| **Infrastructure** | Error handling, session mgmt, toasts, sanitization | `create-function`, `add-rules` | [`references/infrastructure-plan.md`](../references/infrastructure-plan.md) |

---

## Conventions

These rules govern all plans regardless of type.

| Rule | Description |
|------|-------------|
| **Scope** | Each plan targets a single workflow, feature, or use-case. If a plan touches unrelated concerns, split it. |
| **Cross-skill** | A single plan can freely invoke multiple skills (build + logic + integration). Plans are scoped by *feature*, not by *skill*. |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10`, `11`. |
| **Execution** | Plans execute sequentially. Each plan declares its dependencies via `Depends on`. |
| **Max per journey** | 15 plans. If more are needed, the journey is too complex — decompose it. |
| **File path** | `plans/<journey>/NN-<short-title>.md` |
| **Validate + Deploy** | Every plan ends with a validate step and a deploy step. Always ask the user before pushing — never push silently. The user may defer deployment at the checkpoint. |
| **Dependency declaration** | Always state what each dependency provides, not just its number. e.g., `Plan 01 (panel skeleton)` not just `Plan 01`. |
| **Acceptance criteria** | Every criterion must be independently testable. Prefer specific observable behaviors over vague statements. |
| **Specification tables** | Use tables for structured data (field specs, rule definitions, API mappings). Use trees for hierarchical structures (panel layout). Use pseudocode for algorithms. |