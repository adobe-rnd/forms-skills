---
name: planner
description: >
  Plan generator. Decomposes user requirements into ordered, executable plans
  using a configurable strategy. The orchestrator routes here when no plans
  exist for a journey and requirements need to be broken down into plans.
  Triggers: plan, plans, journey, build, start, generate plans, create plans,
  decompose, what plans, next plan.
type: skill
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Planner

Generates ordered, executable plans from user requirements. The orchestrator routes here when a journey has requirements but no plans yet.

---

## What the Planner Does

```
Requirements (journey docs, Screen.md, screenshots, v1 JSON)
     │
     ▼
┌────────────────────────────────┐
│  Resolve strategy              │
│  (custom or default)           │
└─────────────┬──────────────────┘
              │
              ▼
┌────────────────────────────────┐
│  Analyze requirements          │
│  using analysis domain skills  │
└─────────────┬──────────────────┘
              │
              ▼
┌────────────────────────────────┐
│  Decompose into ordered plans  │
│  Write to plans/<journey>/     │
└────────────────────────────────┘
```

The planner takes requirements as input and produces a set of plan files ready for sequential execution by the orchestrator.

---

## Strategies

A strategy is a set of guidelines for how to decompose requirements into ordered plans. The orchestrator resolves the strategy before generating any plans.

### Resolution Order

| Priority | Location | Description |
|----------|----------|-------------|
| 1 (highest) | `plans/custom-strategy.md` in workspace | User-provided override — full control over plan decomposition |
| 2 (default) | [`references/default-strategy.md`](references/default-strategy.md) | Default strategy — workflow-focused decomposition based on real-world experience |

**Resolution rule:** If `plans/custom-strategy.md` exists in the workspace, use it. Otherwise, use the default.

### Default Strategy

The default strategy ([`references/default-strategy.md`](references/default-strategy.md)) analyzes requirements and decomposes them into workflow-focused plans:

1. Analyze requirements using `analysis` domain skills
2. Identify the form's structure (panels, fields, workflows)
3. Decompose into ordered plans — structure first, then workflows, then cross-cutting concerns

### Custom Strategy

Users can override the default by placing a strategy file at `plans/custom-strategy.md` in their workspace. A custom strategy can define any decomposition approach — by screen, by feature, by priority, or any other scheme that fits the project.

---

## Output

The planner produces plan files at `plans/<journey>/NN-<title>.md`, numbered sequentially, ready for execution by the orchestrator.

---

## Plan Types

The planner uses these plan type references when decomposing requirements into plans. Each type defines the specification patterns, typical steps, and characteristics for that category of work.

| Type | Reference | When to Use |
|------|-----------|-------------|
| **Structure** | [`references/structure-plan.md`](references/structure-plan.md) | Building the form skeleton — panels, fields, basic validations |
| **Workflow** | [`references/workflow-plan.md`](references/workflow-plan.md) | Building a specific user flow or conditional branch |
| **Logic** | [`references/logic-plan.md`](references/logic-plan.md) | Adding cross-cutting validations and business rules |
| **Integration** | [`references/integration-plan.md`](references/integration-plan.md) | Wiring APIs — data loading, save/submit, external services |
| **Infrastructure** | [`references/infrastructure-plan.md`](references/infrastructure-plan.md) | Cross-cutting concerns — error handling, session management, toasts |

A plan's type is not declared explicitly — it emerges from which specification sections and skills the plan uses. The planner should consult the relevant plan type reference(s) when generating each plan to ensure the specification follows the correct patterns.

---

## Plan Conventions

Generated plans follow a standard structure. Full template and field definitions: **[`assets/plan-template.md`](assets/plan-template.md)**

| Property | Convention |
|----------|-----------|
| **Path** | `plans/<journey>/NN-<short-title>.md` |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10`, `11` |
| **Max per journey** | 15 plans — if more are needed, the journey is too complex; split it |
| **Template** | `assets/plan-template.md` |

---

## Quick Reference

| What | Where |
|------|-------|
| Default plan generation strategy | `references/default-strategy.md` |
| User strategy override | `plans/custom-strategy.md` (in workspace) |
| Plan template | `assets/plan-template.md` |
| Domain registry (skill resolution) | `../domain-registry/SKILL.md` |