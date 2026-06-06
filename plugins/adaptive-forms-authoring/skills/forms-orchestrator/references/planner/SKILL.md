---
name: planner
description: >
  Use when a journey spec exists but no execution plans have been generated yet.
  Reads journeys/<journey>/spec.md and produces ordered plan files at
  journeys/<journey>/plans/.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.2"
  type: skill
  triggers:
    - plan
    - generate plans
    - decompose requirements
    - what plans exist
    - next plan
    - journey
    - start
---

# Planner

Generates ordered, executable plans from a journey spec. The orchestrator routes here when `$FORMS_WORKSPACE/journeys/<journey>/spec.md` exists but no plans have been generated.

---

## What the Planner Does

```
journeys/<journey>/spec.md
  + refs/apis/<name>.<ext> (if integrations)
          │
          ▼
  ┌───────────────────────┐
  │  Select plan types    │
  │  from spec sections   │
  └──────────┬────────────┘
             │
             ▼
  ┌───────────────────────┐
  │  Order by dependency  │
  │  (see GUARDRAILS.md)  │
  └──────────┬────────────┘
             │
             ▼
  ┌───────────────────────┐
  │  Write numbered plan  │
  │  files to plans/      │
  └───────────────────────┘
```

Input: `$FORMS_WORKSPACE/journeys/<journey>/spec.md`
Output: `$FORMS_WORKSPACE/journeys/<journey>/plans/NN-<title>.md`

---

## Guardrails

Plan type selection, ordering, scope rules, acceptance criteria requirement: **[`assets/GUARDRAILS.md`](assets/GUARDRAILS.md)**

---

## Plan Types

| Type | Primary Skills | When to Create |
|---|---|---|
| **Custom Component** | `forms-custom-components` | spec has custom component entries |
| **Screen** (one per wizard step) | `forms-author`, `forms-content-modeler` | always — one per screen in spec |
| **Interaction Flow** | `forms-rule-author` | multi-screen journey (screen count > 1) |
| **Functional Rules** | `forms-rule-author` | spec has functional rules |
| **Complex Rules** | `forms-rule-author` | spec has complex rules / calculations |
| **Validation** | `forms-rule-author` | spec has validations |
| **Integration** | `forms-integration`, `forms-rule-author` | spec has API integrations |
| **Submit** | `forms-author`, `forms-integration` | always |
| **QA** | — | always — last plan |

---

## Output

Plan files at `$FORMS_WORKSPACE/journeys/<journey>/plans/NN-<title>.md`, numbered sequentially, ready for execution.

Each plan follows **[`assets/TEMPLATE.md`](assets/TEMPLATE.md)** and must include a `## Acceptance Criteria` section.

---

## Plan Conventions

| Property | Convention |
|---|---|
| **Path** | `$FORMS_WORKSPACE/journeys/<journey>/plans/NN-<short-title>.md` |
| **Numbering** | Zero-padded two digits: `01`, `02`, ..., `10`, `11` |
| **Max per journey** | 15 — if more needed, journey is too complex; flag to user |
| **Template** | `assets/TEMPLATE.md` |
| **Guardrails** | `assets/GUARDRAILS.md` |

---

## Quick Reference

| What | Where |
|---|---|
| Plan type selection + ordering | `assets/GUARDRAILS.md` |
| Plan template + type patterns | `assets/TEMPLATE.md` |
| Domain registry (skill resolution) | `../domain-registry/SKILL.md` |
