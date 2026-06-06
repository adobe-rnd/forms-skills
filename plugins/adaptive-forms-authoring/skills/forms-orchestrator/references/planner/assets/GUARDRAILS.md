---
name: planner-guardrails
description: >
  Use when generating plans from a journey spec. Covers plan type selection,
  ordering, scope rules, and the acceptance criteria requirement.
---

# Planner Guardrails

How to decompose a journey spec into ordered plans. Use when generating plans from `journeys/<journey>/spec.md`.

---

## Inputs

| Input | Path | Required |
|---|---|---|
| Journey spec | `journeys/<journey>/spec.md` | Yes |
| API reference docs | `refs/apis/<name>.<ext>` | If integrations exist |
| Custom strategy override | `plans/custom-strategy.md` (workspace root) | No — overrides this file if present |

---

## Plan Type Selection

Read the journey spec and determine which plan types apply:

| Plan Type | Create when spec has... | Skills |
|---|---|---|
| **Custom Component** | `## Custom Components` section with entries | `forms-custom-components` |
| **Fragment** (one per fragment) | `## Fragments` section with entries | `forms-author` |
| **Screen** (one per wizard step) | Any screen under `## Screens` | `forms-author`, `forms-content-modeler` |
| **Interaction Flow** | `Screen count: N` where N > 1 (multi-screen journey) | `forms-rule-author` |
| **Functional Rules** | `## Functional Rules` section with entries | `forms-rule-author` |
| **Complex Rules** | `## Complex Rules` section with entries | `forms-rule-author` |
| **Validation** | `## Validations` section with entries | `forms-rule-author` |
| **Integration** | `## Integrations` section with entries | `forms-integration`, `forms-rule-author` |
| **Style** | `## Style` section, or spec has brand colors / design tokens / theming requirements | `forms-style`, `forms-component-inventory` |
| **Submit** | `## Submit` section (always present) | `forms-author`, `forms-integration` |
| **QA** | Always — every journey ends with QA | lint + smoke test |

**Always create:** Screen × N, Submit, QA.
**Conditionally create:** all others.

> **Fragment before Screen:** Fragment plans must complete before any Screen plan that references them. Fragment JSON must exist in the repo before it can be referenced in a host form panel.

---

## Recommended Plan Order

```dot
digraph plan_order {
  rankdir=LR;
  node [shape=box];

  CC  [label="Custom\nComponent"];
  FRAG [label="Fragment"];
  S1  [label="Screen 1"];
  SN  [label="Screen N"];
  IF  [label="Interaction\nFlow"];
  FR  [label="Functional\nRules"];
  CR  [label="Complex\nRules"];
  VL  [label="Validation"];
  IN  [label="Integration"];
  SB  [label="Submit"];
  QA  [label="QA"];

  CC -> FRAG [style=dashed, label="if fragments"];
  CC -> S1   [style=dashed, label="if no fragments"];
  FRAG -> S1;
  S1 -> SN -> IF [style=dashed, label="if multi-screen"];
  SN -> FR;
  FR -> CR [style=dashed, label="if complex rules"];
  SN -> VL;
  SN -> IN [style=dashed, label="if APIs"];
  IN -> SB;
  VL -> SB;
  FR -> SB;
  SB -> QA;
}
```

| Order | Plan Type | Dependency |
|---|---|---|
| 0 | **Custom Component** | Nothing (must exist before screens that use it) |
| 0.5 | **Fragment** (one per fragment) | Custom Component (if any); must exist before screens that reference it |
| 1–N | **Screen** (one per wizard step) | Custom Component + Fragment (if any) |
| N+1 | **Interaction Flow** | All Screen plans complete |
| Next | **Functional Rules** | All Screen plans complete |
| Next | **Complex Rules** | Functional Rules |
| Next | **Validation** | All Screen plans complete |
| Next | **Integration** | All Screen plans complete |
| Next | **Style** | All Screen plans complete (style what exists) |
| Last-1 | **Submit** | Integration (if any), Validation |
| Last | **QA** | All preceding plans |

> **Adapt, don't force.** Simple single-screen form with no APIs: Screen + Validation + Submit + QA = 4 plans. Only add plan types that the spec requires.

---

## Decomposition Principles

1. **One concern per plan** — each plan targets one functional area. If a plan touches unrelated concerns, split it.
2. **Screen plans are structure only** — fields + layout + CSS. No rules, no APIs, no navigation wiring.
3. **Incremental testability** — after each plan, the form must be in a testable, non-broken state.
4. **Explicit dependencies** — every plan declares which prior plans must be complete.
5. **Max 15 plans per journey** — if more needed, journey is too complex; split it or flag to user.
6. **Read API refs** — for Integration plans, read `refs/apis/<name>.<ext>` for endpoint and schema details. Do not duplicate API schema in the plan — reference the file.

---

## Acceptance Criteria — Required in Every Plan

Every plan **must** end with a `## Acceptance Criteria` section. No exceptions.

```markdown
## Acceptance Criteria

- [ ] <Specific observable behavior — not vague>
- [ ] Form loads without console errors
- [ ] No regressions in previously implemented plans
```

**QA plan criteria (thin — covers the full journey):**

```markdown
## Acceptance Criteria

- [ ] `npm run lint` in `$FORMS_EDS_ROOT` exits 0
- [ ] Full journey walkthrough: all screens, happy path, submit succeeds
- [ ] All acceptance criteria from all preceding plans still pass
```

Criteria must be independently testable. "Works correctly" is not a criterion.

> **Plan Completion Gate:** Before marking a plan ✅, the orchestrator MUST verify EVERY
> `- [ ]` criterion against live form state (read AEM page content, check field properties,
> confirm behaviour in rendered form). Marking ✅ based on intent or successful step
> execution alone is forbidden.

---

## Plan File Convention

| Property | Convention |
|---|---|
| **Path** | `journeys/<journey>/plans/NN-<short-title>.md` |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10`, `11` |
| **Naming** | Lowercase, hyphen-separated: `01-custom-component.md`, `03-screen-01-personal-info.md` |
| **Template** | `assets/TEMPLATE.md` |
| **Max per journey** | 15 |
