---
name: pipeline-registry
description: >
  Pipeline registry and router. Catalogs all available pipelines and selects
  the correct one based on user intent. Each pipeline is a directed graph of
  phases stored as a separate markdown file in this folder.
  Triggers: pipeline, workflow, end to end, full build, which pipeline,
  list pipelines, start pipeline.
type: router
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Pipeline Registry

Catalogs all pipelines and routes user intents to the correct one. Each pipeline is a directed graph of phases — a self-contained workflow definition stored alongside this registry.

---

## How Pipelines Work

```
User Intent
     │
     ▼
┌──────────────────────┐
│  This Registry        │──→ matches intent to a pipeline
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Pipeline File        │──→ defines phase graph, gates, checkpoints
│  (e.g. build-journey) │
└──────────┬───────────┘
           │ each phase declares: domain + skill + input + output + gate
           ▼
     Domain Registry       ──→ resolves domain/skill → executes
```

Pipelines are **multi-phase workflows**. For one-off tasks (push a form, add a rule), the orchestrator skips pipelines and routes directly to a domain.

---

## Catalog

| ID | Pipeline | File | Purpose |
|----|----------|------|---------|
| `build-journey` | Build Journey | [`references/build-journey.md`](references/build-journey.md) | End-to-end: requirements → analysis → build → integrate → logic → deploy |

---

## Intent Routing

Match the user's intent to a pipeline. First match wins.

| Intent Pattern | Pipeline | Confidence |
|----------------|----------|------------|
| build a form, create a form end to end | `build-journey` | High |
| start a journey, new journey | `build-journey` | High |
| implement requirements, analyze and build | `build-journey` | High |
| end to end, full workflow, all phases | `build-journey` | High |
| how do I build a form?, what do I do next? | `build-journey` | Medium — confirm with user |

---

## Selection & Execution

Selection algorithm and step-by-step execution instructions once a pipeline is matched: **[`assets/selection-rules.md`](assets/selection-rules.md)**

---

## Plan Integration

How pipelines relate to plans, plan conventions, and status tracking: **[`assets/plan-integration.md`](assets/plan-integration.md)**

---

## Pipeline Template & Contribution Guide

All pipeline definition files must follow the standard pipeline template. Template, plus instructions for adding and deprecating pipelines: **[`assets/contribution-guide.md`](assets/contribution-guide.md)**

Template file: [`assets/templates/pipeline-template.md`](assets/templates/pipeline-template.md)

---

## Quick Reference

| What | Where |
|------|-------|
| Selection rules & execution | `assets/selection-rules.md` |
| Plan integration & conventions | `assets/plan-integration.md` |
| Pipeline template | `assets/templates/pipeline-template.md` |
| Contribution guide | `assets/contribution-guide.md` |
| Pipeline definitions | `references/*.md` |