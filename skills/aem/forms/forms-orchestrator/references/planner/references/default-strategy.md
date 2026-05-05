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

## Form Type Detection (Run First)

Before decomposing requirements, determine whether the user intends an **EDS/Franklin form** or a **Core Component Adaptive Form**. This controls which skills are included in plans.

| Signal | Form Type |
|--------|-----------|
| "Core Component", "CC form", "adaptive form core component", "core component form" | `core_component` |
| "EDS form", "Franklin form", or no type specified | `eds` |

### Core Component Forms — Constrained Skill Set

When form type is `core_component`, apply these constraints throughout all plans:

| Constraint | Reason |
|------------|--------|
| **Use `scaffold-form --form-type core_component`** | Generates correct `mysite/components/adaptiveForm/formcontainer` root |
| **Use `form-sync push --form-type core_component`** in every push step | Creates proper CC page structure via Sling import |
| **No `create-function` skill** | Custom JS functions require GitHub deployment — not part of CC workflow |
| **No `create-component` skill** | Custom EDS components are GitHub-deployed — not applicable to CC forms |
| **No `manage-apis` / API client generation** | CC forms use AEM-native rule actions for API calls; no JS client files needed |
| **No `eds-code-sync` steps** | No GitHub code to sync for CC forms |
| **No EDS code deployment** | Skip entirely — CC form deployment is AEM-only |

For CC forms, API integration (if any) uses AEM visual rules with the `globals.functions.request()` built-in — referenced directly in `add-rules` steps, not wrapped in exported custom functions.

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

### EDS / Franklin Form

A moderately complex EDS form with conditional branches and API integrations:

| Plan | Focus | Skills Used |
|------|-------|-------------|
| 01 | Form structure & initial fields | `scaffold-form`, `create-form`, `sync-forms` |
| 02 | Workflow branch A (e.g., conditional section) | `create-form`, `add-rules`, `sync-forms` |
| 03 | Workflow branch B (e.g., alternative path) | `create-form`, `add-rules`, `create-function`, `sync-forms` |
| 04 | Cross-field validations | `create-function`, `add-rules`, `sync-forms` |
| 05 | API integration — submit | `manage-apis`, `create-function`, `add-rules`, `sync-forms` |
| 06 | Error handling | `create-function`, `add-rules`, `sync-forms` |

### Core Component Adaptive Form

Same form requirements — but built as a Core Component Adaptive Form. Plans are simpler because there is no GitHub/EDS workflow:

| Plan | Focus | Skills Used |
|------|-------|-------------|
| 01 | Form structure & initial fields | `scaffold-form --form-type core_component`, `create-form`, `sync-forms --form-type core_component` |
| 02 | Workflow branch A | `add-rules`, `sync-forms --form-type core_component` |
| 03 | Workflow branch B | `add-rules`, `sync-forms --form-type core_component` |
| 04 | Cross-field validations | `add-rules`, `sync-forms --form-type core_component` |
| 05 | API submit | `add-rules` (using built-in `globals.functions.request`), `sync-forms --form-type core_component` |

**Key differences for CC forms:**
- No `create-function` — all logic lives in visual rules via `add-rules`
- No `create-component` — no custom EDS components
- No `manage-apis` — no JS API client generation
- No `eds-code-sync` — no GitHub code to deploy
- Every push step uses `form-sync push --form-type core_component`

---

## Customization

Users can override this default strategy entirely by placing a custom strategy file at:

```
plans/custom-strategy.md
```

in their workspace. When a custom strategy exists, the orchestrator uses it instead of this file. A custom strategy can define any decomposition approach — by screen, by feature, by user story, by priority, or any other scheme.

See the Plan Registry (`../SKILL.md`) for strategy resolution rules.