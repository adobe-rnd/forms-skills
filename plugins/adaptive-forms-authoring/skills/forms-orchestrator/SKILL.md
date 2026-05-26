---
name: forms-orchestrator
description: >
  Entry point for all AEM Forms work. Use when starting any form task — building
  a form, implementing a journey, executing a plan step, or routing a single
  intent. Also use when unsure which skill applies.
license: Apache-2.0
metadata:
  author: Adobe
  version: "1.0"
  type: router
  triggers:
    - plan
    - workflow
    - build form
    - end to end
    - orchestrate
    - next step
    - getting started
    - what skill
    - how to
---

# Forms Orchestrator — Skill Gateway

Pure router. Two registries. No implementation logic.

```
User Intent
     │
     ▼
┌────────────────────────────────────────┐
│  Plans                                 │
│  plans/<journey>/NN-<title>.md         │──→ ordered steps, each declaring skill(s)
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│  Domain Registry                       │
│  references/domain-registry/SKILL.md   │──→ resolves domain/skill to implementation
└──────────────────┬─────────────────────┘
                   │
                   ▼
              Skill executes
```

> This gateway **selects** and **routes**. It does not implement.
> Plans define the step sequence. Domains own the skills. The orchestrator connects them.

---

## Routing

When a user prompt arrives, follow the routing algorithm in [`assets/ROUTES.md`](assets/ROUTES.md):

1. **Workspace gate** — no workspace? → read `assets/SETUP.md` and run setup inline (hard block)
2. **Active plan** — 🔵 Active plan in `.agent/handover.md`? → resume it
3. **Plans exist** — plans in `plans/<journey>/`? → pick next pending → execute
4. **Generate plans** — user has requirements but no plans? → Planner generates them → execute
5. **Domain fallback** — intent is a single task? → route to domain directly
6. **No match** — ask user to clarify

Full step-by-step logic, decision tables, and precedence rules: **[`assets/ROUTES.md`](assets/ROUTES.md)**

---

## Registries

| Registry | File | What It Does |
|----------|------|-------------|
| **Planner** | [`references/planner/SKILL.md`](references/planner/SKILL.md) | Generates plans from user requirements (journey docs, screenshots, Screen.md, etc.) using a default or custom strategy |
| **Domain Registry** | [`references/domain-registry/SKILL.md`](references/domain-registry/SKILL.md) | Catalogs domains and skills, matches intents to domains, resolves plan step targets to executable skills. **Read this file — do not invoke it as a skill.** |

Plan files live in `plans/<journey>/`. Domain skill trees live in `skills/forms-<domain>/` (sibling directories in the repo).

---

## Guidelines & Constraints

All orchestrator constraints, conventions, file locations, workspace resolution, plan conventions, and general routing rules: **[`assets/GUARDRAILS.md`](assets/GUARDRAILS.md)**

---

## Quick Reference

| What | Where |
|------|-------|
| Routing algorithm | `assets/ROUTES.md` |
| Constraints & conventions | `assets/GUARDRAILS.md` |
| Plan template | `references/planner/assets/TEMPLATE.md` |
| Planner | `references/planner/SKILL.md` |
| Plan files | `plans/<journey>/NN-<title>.md` |
| Workspace setup (inline) | `assets/SETUP.md` |
| Domain registry (read) | `references/domain-registry/SKILL.md` |
| Domain routers (read)  | `skills/forms-<domain>/SKILL.md` |
| Domain template | `references/domain-registry/assets/TEMPLATE.md` |
