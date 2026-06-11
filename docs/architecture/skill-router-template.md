---
name: skill-router-template
description: >
  Generalized template for SKILL.md files that route user intents
  to sub-skills. Routers dispatch — they do not implement.
metadata:
  type: router
---

# Skill Router Template

Use this template for any SKILL.md that dispatches to sub-skills rather than implementing logic itself. This covers orchestrators, domain routers, pipeline registries, and any other routing layer.

> **Core rule:** A router SKILL.md should be **under 100 lines**. If it's growing beyond that, offload content to `assets/` (see [Routing Table Template](routing-table-template.md) and [Guidelines Template](guidelines-template.md)).

---

## Template

Copy and fill in the sections below.

### Frontmatter

The `type` field declares the skill's architectural role and lives under `metadata:`. Always include it.

| `metadata.type` | Use When |
|--------|----------|
| `router` | Any SKILL.md that dispatches to sub-skills (orchestrators, registries, domain entry routers) |
| `skill` | Leaf skill that does actual work (don't use this template). Also used for **planners** that dynamically generate plans from a journey spec — see [Plan-Driven Workflows](README.md#plan-driven-workflows) |

```
---
name: <router-id>
description: >
  <One-line purpose. What does this router dispatch? What triggers it?>
license: Apache-2.0
metadata:
  author: <Author or Organization>
  version: "<semver>"
  type: router
---
```

> **Note:** There is no `type: domain`. A domain is a logical grouping catalogued by the registry; its entry router uses `type: router`. For plan-driven workflows, pair this router with a planner (`type: skill`) — see [Plan-Driven Workflows](README.md#plan-driven-workflows). Leaf skills use `type: skill`.

### Body

```
# <Router Name>

<1–2 sentence description. What this router does and what it does NOT do.>

> This router **selects** and **routes**. It does not implement.

---

## Routing Table

First match wins.

| Intent | Skill | Description |
|--------|-------|-------------|
| <Intent pattern 1> | `<skill-id-1>` | <What this skill does> |
| <Intent pattern 2> | `<skill-id-2>` | <What this skill does> |
| <Intent pattern 3> | `<skill-id-3>` | <What this skill does> |

> If the intent is ambiguous, present the top matches to the user and let them choose.

---

## Sub-Skills

| Skill | Path | Purpose |
|-------|------|---------|
| `<skill-id-1>` | [`references/<skill-id-1>/SKILL.md`](references/<skill-id-1>/SKILL.md) | <One-line purpose> |
| `<skill-id-2>` | [`references/<skill-id-2>/SKILL.md`](references/<skill-id-2>/SKILL.md) | <One-line purpose> |

---

## Assets

Link to offloaded content. Remove rows that don't apply.

| What | Where |
|------|-------|
| Routing algorithm (detailed) | [`assets/ROUTES.md`](assets/ROUTES.md) |
| Constraints & conventions | [`assets/GUARDRAILS.md`](assets/GUARDRAILS.md) |
| Inline setup / bootstrap | [`assets/SETUP.md`](assets/SETUP.md) |
| Templates | `assets/TEMPLATE.md` |
```

---

## Section Reference

| Section | Required | Purpose |
|---------|----------|---------|
| **Frontmatter** | Yes | Identity, triggers, metadata |
| **Title + Description** | Yes | What this router does (1–2 sentences) |
| **Routing Table** | Yes | The core dispatch logic — intent → skill |
| **Sub-Skills** | Yes | Registry of all sub-skills with paths |
| **Assets** | If offloading | Links to offloaded routing logic, guidelines, templates |

---

## When to Offload to Assets

| Symptom | Action |
|---------|--------|
| SKILL.md exceeds ~100 lines | Offload the largest section to `assets/` |
| Routing algorithm has multi-step logic, decision trees, or precedence rules | Move to `assets/ROUTES.md` |
| Constraints apply across multiple sub-skills | Move to `assets/GUARDRAILS.md` |
| Inline bootstrap / workspace setup steps | Move to `assets/SETUP.md` |
| Templates for creating new sub-skills | Move to `assets/TEMPLATE.md` |

---

## Examples in This Repo

| Router | Type | Pattern | Location |
|--------|------|---------|----------|
| Forms Orchestrator | `router` | Top-level gateway → planner + domain registry | `plugins/adaptive-forms-authoring/skills/forms-orchestrator/SKILL.md` |
| Domain Registry | `router` | Flat catalog, resolves plan steps / intents to sibling skills | `plugins/adaptive-forms-authoring/skills/forms-orchestrator/references/domain-registry/SKILL.md` |
| Analysis (domain entry) | `router` | Routes analysis intents to analysis sub-skills | `plugins/adaptive-forms-authoring/skills/forms-analysis/SKILL.md` |
| Integration (domain entry) | `router` | Routes integration intents to `manage-apis` | `plugins/adaptive-forms-authoring/skills/forms-integration/SKILL.md` |