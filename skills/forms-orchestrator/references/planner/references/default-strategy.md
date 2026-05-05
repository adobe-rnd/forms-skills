---
name: default-strategy
description: >
  Default plan-generation strategy. Decomposes form requirements into an ordered
  set of workflow-focused plans. Analyzes inputs (journey docs, Screen.md,
  screenshots, v1 form JSON) and produces sequenced plan files that build the
  form incrementally — structure first, then workflows, then cross-cutting concerns.
type: strategy
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Default Plan Generation Strategy

Given a set of requirements, decompose them into an ordered set of plans that build the form incrementally. This strategy focuses on **workflow-based decomposition** — each plan targets a distinct functional workflow or concern rather than a technical layer.

> This strategy balances incremental progress, testability, and manageable plan scope.

---

## Inputs

Any combination of the following:

| Input | Description |
|-------|-------------|
| Requirements docs | Free-form requirements, user stories, acceptance criteria |
| Journey specs | `journeys/<journey>/journey.md` — structured journey specification |
| Screen.md | `journeys/<journey>/screens/<screen>/Screen.md` — detailed screen documentation |
| Screenshots | UI mockups or screenshots of existing forms |
| v1 form JSON | Existing `form.json` from a v1 form being migrated or extended |

At minimum, one input source must be available. Richer inputs produce better plan decomposition.

---

## Process

### Step 1 — Analyze Requirements

Use `analysis` domain skills to understand the form:

- **`analyze-requirements`** — parse requirements docs, extract form specification, identify complexity
- **`create-screen-doc`** — generate Screen.md from screenshots or requirements (if not already available)
- **`analyze-v1-form`** — extract structure and logic from existing v1 form JSON (for migration scenarios)
- **`review-screen-doc`** — validate existing Screen.md against form JSON (quality gate)

The goal is to produce a clear picture of what the form needs: its panels, fields, validation rules, conditional logic, API integrations, and workflows.

### Step 2 — Identify Structure

From the analysis output, identify:

- **Panels and sections** — the form's top-level structure
- **Fields and field groups** — what data is collected
- **Workflows and branches** — conditional paths (e.g., user category → different field sets)
- **API integrations** — data loading, save/submit, external validations
- **Cross-cutting concerns** — error handling, session management, complex async flows

### Step 3 — Decompose into Plans

Create ordered plan files following the **recommended decomposition order** below. This order is a guideline, not a rigid mandate — adapt it to the specific form's needs.

#### Recommended Plan Order

| Order | Focus | Example Title | What It Covers |
|-------|-------|---------------|----------------|
| 1 | **Form structure & skeleton** | `01-form-structure.md` | All panels, initial fields, basic layout — the form's skeleton |
| 2–N | **Major workflows** (one per plan) | `02-workflow-branch-a.md`, `03-workflow-branch-b.md` | One plan per major conditional branch or workflow — visibility rules, workflow-specific fields, branch logic |
| Next | **Cross-cutting validations** | `04-field-validations.md` | Validation rules that span multiple panels or workflows — format checks, cross-field validations, error messages |
| Next | **API integrations** | `05-api-prefill.md`, `06-api-submit.md` | Data loading (prefill, lookups), save/submit handlers, API client generation |
| Next | **Complex async flows** | `07-async-verification.md` | If applicable — OTP verification, external checks, real-time validations, polling flows |
| Last | **Infrastructure / cross-cutting** | `08-error-handling.md` | Error handling, session management, analytics, accessibility — concerns that wrap the entire form |

> **Adapt, don't force.** A simple form might need only 3 plans. A form with no APIs skips integration plans entirely. A form with heavy async flows might front-load those. The order above is a starting point.

#### Decomposition Principles

1. **One workflow per plan** — each plan should target a single user-facing workflow or concern. If a plan touches unrelated features, split it.
2. **Vertical slices** — a single plan can invoke build + logic + integration skills. Plans are scoped by *feature*, not by *skill domain*.
3. **Incremental testability** — after each plan completes, the form should be in a testable state. Avoid plans that leave the form in a broken intermediate state.
4. **Dependency clarity** — each plan explicitly declares which prior plans must be complete. The dependency graph should be simple (mostly linear with occasional parallel-safe pairs).
5. **Manageable scope** — if a plan has more than 8–10 steps, it's probably too large. Split it into two plans along a natural boundary.

### Step 4 — Write Plan Files

Write each plan to `plans/<journey>/NN-<title>.md` following the plan template at `assets/plan-template.md` (relative to the plans registry). Each plan file must include:

- **Header block** — source references, skills needed, dependencies
- **Objective** — one paragraph describing what the plan achieves
- **Specification** — detailed design (field tables, rule tables, API mappings, etc.)
- **Steps to Execute** — ordered list of skill invocations
- **Acceptance Criteria** — testable conditions that define "done"

---

## Output

Plan files at `plans/<journey>/NN-<title>.md`, numbered sequentially, ready for execution.

```
plans/<journey>/
├── 01-form-structure.md
├── 02-workflow-branch-a.md
├── 03-workflow-branch-b.md
├── 04-field-validations.md
├── 05-api-prefill.md
├── 06-api-submit.md
├── 07-async-verification.md
└── 08-error-handling.md
```

The exact number and naming of plans depends on the form's complexity and structure.

---

## Example Decomposition

A moderately complex form with conditional branches and API integrations might decompose into plans like this:

| Plan | Focus | Skills Used |
|------|-------|-------------|
| 01 | Form structure & initial fields | `forms-content-author` |
| 02 | Workflow branch A (e.g., conditional section) | `forms-content-author`, `forms-rule-creator` |
| 03 | Workflow branch B (e.g., alternative path) | `forms-content-author`, `forms-rule-creator` |
| 04 | Shared fields & common sections | `forms-content-author`, `forms-rule-creator` |
| 05 | Cross-field business rule validations | `forms-rule-creator` |
| 06 | API integration — data loading & prefill | `manage-apis`, `forms-rule-creator` |
| 07 | API integration — save & submit | `manage-apis`, `forms-rule-creator` |
| 08 | Error handling & session management | `forms-rule-creator` |

**Key principles illustrated:**
- Plans follow the recommended order (structure → workflows → validations → integrations → infrastructure)
- Every plan freely mixes skills (`forms-content-author` + `forms-rule-creator` in the same plan)
- Each plan ends with validate + push, keeping the form in a deployable state
- The exact number of plans depends on the form's complexity — a simple form might need only 3

---

## Customization

Users can override this default strategy entirely by placing a custom strategy file at:

```
plans/custom-strategy.md
```

in their workspace. When a custom strategy exists, the orchestrator uses it instead of this file. A custom strategy can define any decomposition approach — by screen, by feature, by user story, by priority, or any other scheme.

See the Plan Registry (`../SKILL.md`) for strategy resolution rules.