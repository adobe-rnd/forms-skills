---
name: domain-registry
description: Use when resolving which domain or skill handles a specific intent, or when listing available capabilities. Read by the orchestrator during plan execution and direct routing.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.2"
  type: router
  triggers:
    - which skill
    - which domain
    - what can you do
    - list skills
    - capabilities
---

# Domain Registry

Two entry points:
1. **Plan step** declares `domain: X, skill: Y` → use this registry to find the SKILL.md path, then invoke it
2. **User intent** doesn't match a specific skill → use the "Route When" column to pick the right domain

---

## Domains

### analysis
**Router:** `skills/forms-analysis/SKILL.md`
**Route when:** user provides requirements doc, screenshots, Figma, v1 AEM JSON, or asks to produce a journey spec

| Skill | Path | Purpose |
|-------|------|---------|
| `analyze-requirements` | `skills/forms-analysis/references/analyze-requirements/SKILL.md` | Requirements doc / inline text / .docx → journey spec |
| `visual-analysis` | `skills/forms-analysis/references/visual-analysis/SKILL.md` | Screenshots / Figma / mockups → journey spec sections |
| `analyze-v1-form` | `skills/forms-analysis/references/analyze-v1-form/SKILL.md` | v1 AEM Adaptive Form JSON → journey spec |

---

### content-author
**No single router** — invoke the matching skill directly based on intent.
**Route when:** building or editing form structure, field types, or custom components

| Skill | Path | Purpose |
|-------|------|---------|
| `forms-author` | `skills/forms-author/SKILL.md` | Create and edit forms via AEM Sites Content MCP |
| `forms-content-modeler` | `skills/forms-content-modeler/SKILL.md` | Resolve field types and build form component JSON |
| `forms-component-inventory` | `skills/forms-component-inventory/SKILL.md` | Survey registered custom fd:viewType components before field selection |
| `forms-custom-components` | `skills/forms-custom-components/SKILL.md` | Scaffold and implement custom EDS form components |

---

### rule-creator
**Router:** `skills/forms-rule-author/SKILL.md`
**Route when:** writing or editing business rules, visibility conditions, custom JS functions

| Skill | Path | Purpose |
|-------|------|---------|
| `forms-rule-author` | `skills/forms-rule-author/SKILL.md` | Rules, conditions, custom functions, optimization |

---

### integration
**Router:** `skills/forms-integration/SKILL.md`
**Route when:** connecting to APIs, FDM sync, prefill from external data, submit endpoints

| Skill | Path | Purpose |
|-------|------|---------|
| `forms-integration` | `skills/forms-integration/SKILL.md` | Domain router for API & data integration |
| `manage-apis` | `skills/forms-integration/references/manage-apis/SKILL.md` | OpenAPI sync, JS API client generation, FDM wiring |

---

### context-management
**Router:** `skills/forms-context-management/SKILL.md`
**Route when:** saving or loading session state, updating handover, logging sessions

| Skill | Path | Purpose |
|-------|------|---------|
| `forms-context-management` | `skills/forms-context-management/SKILL.md` | Domain router for session state |
| `manage-context` | `skills/forms-context-management/references/manage-context/SKILL.md` | Read/write handover.md, history, session log |

---

## Skill Resolution — Plan Steps

When a plan step declares a skill:

1. Find the domain section above that contains the skill
2. Read the SKILL.md at the listed path
3. If the domain has a router → the router dispatches internally
4. If the domain has no router (`content-author`) → invoke the skill directly

**Hard stop:** skill or domain not found → halt, report error. Never guess or substitute.

---

## Reference

| What | Where |
|------|-------|
| Domain SKILL.md template | `assets/TEMPLATE.md` |
| Guard rules for orchestrator | `assets/GUARDRAILS.md` |
