---
name: domain-registry
description: >
  Domain registry and router for AEM Forms skills. Catalogs all domains and their
  skills. Routes user intents to the correct domain based on trigger patterns.
  Used by the orchestrator to resolve plan step targets and direct domain routing.
  Triggers: which domain, which skill, what can you do, list skills, capabilities.
type: router
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Domain Registry

Domains are skill containers. Each domain has a router SKILL.md that handles skill-level routing internally. This registry catalogs all domains and their skills, and provides intent-based routing.

> The orchestrator routes here in two scenarios:
> 1. **Plan step execution** — a plan step declares `domain: analysis, skill: analyze-requirements` → this registry resolves the path
> 2. **Direct domain routing** — user intent maps to a single domain → this registry routes to it

---

## Registry

| Domain | Router | Description |
|--------|--------|-------------|
| `analysis` | [`references/analysis/SKILL.md`](references/analysis/SKILL.md) | Analysis & documentation — requirements, screen docs, migration, review |
| `build` | [`references/build/SKILL.md`](references/build/SKILL.md) | Form structure & components — scaffold, create/modify JSON, custom components |
| `logic` | [`references/logic/SKILL.md`](references/logic/SKILL.md) | Business rules & custom functions — rules, JS functions, optimization |
| `integration` | [`references/integration/SKILL.md`](references/integration/SKILL.md) | API & data integration — FDM sync, OpenAPI, JS API clients |
| `infra` | [`references/infra/SKILL.md`](references/infra/SKILL.md) | Infrastructure — workspace setup, form sync, EDS code sync, git |
| `context` | [`references/context/SKILL.md`](references/context/SKILL.md) | Agent memory & continuity — handover, history, session logs |

---

## Skills & Intent Routing

Full catalog of all 16 skills across 6 domains, plus intent-based routing for direct domain routing: **[`assets/skills-catalog.md`](assets/skills-catalog.md)**

---

## Skill Resolution

How plan steps resolve to domain skills (exact-match rules, hard-stop on missing domain/skill): **[`assets/skill-resolution.md`](assets/skill-resolution.md)**

---

## Domain Template & Contribution Guide

All domain router SKILL.md files must follow the standard domain template. Template, plus instructions for adding new domains and skills: **[`assets/contribution-guide.md`](assets/contribution-guide.md)**

Template file: [`assets/templates/domain-template.md`](assets/templates/domain-template.md)

---

## Quick Reference

| What | Where |
|------|-------|
| Skills catalog & intent routing | `assets/skills-catalog.md` |
| Skill resolution algorithm | `assets/skill-resolution.md` |
| Domain template | `assets/templates/domain-template.md` |
| Contribution guide | `assets/contribution-guide.md` |
| Domain routers | `references/<domain>/SKILL.md` |