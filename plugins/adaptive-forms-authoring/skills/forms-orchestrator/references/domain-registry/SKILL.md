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
| `forms-component-discovery` | `skills/forms-component-discovery/SKILL.md` | Survey and register custom fd:viewType components; owns `$FORMS_WORKSPACE/refs/component-registry.md` |
| `forms-custom-components` | `skills/forms-custom-components/SKILL.md` | Scaffold and implement custom EDS form components |

---

### rule-creator
**Router:** `skills/forms-rule-author/SKILL.md`
**Route when:** writing or editing business rules, visibility conditions, custom JS functions

| Skill | Path | Purpose |
|-------|------|---------|
| `forms-rule-author` | `skills/forms-rule-author/SKILL.md` | Rules, conditions, custom functions, optimization |

> **Guard:** `rule-creator` generates `{ fd:rules, fd:events }` only. Applying rules to the form is owned by `forms-author` (content-author domain) via `references/apply-rule-workflow.md` → `apply-rule-patch.bundle.js`. Direct `properties/fd:rules` PATCH from this domain is forbidden.

---

### integration
**Router:** `skills/forms-integration/SKILL.md`
**Route when:** connecting to APIs, FDM sync, prefill from external data, submit endpoints

| Skill | Path | Purpose |
|-------|------|---------|
| `forms-integration` | `skills/forms-integration/SKILL.md` | Domain router for API & data integration |
| `manage-apis` | `skills/forms-integration/references/manage-apis/SKILL.md` | OpenAPI sync, JS API client generation, FDM wiring |

---

### style
**No single router** — invoke `forms-style-screen` directly.
**Route when:** user asks to style, theme, or set colors/typography/layout on a form screen or fragment

| Skill | Path | Purpose |
|-------|------|---------|
| `forms-style-screen` | `skills/forms-style-screen/SKILL.md` | Style a screen or fragment against a design — live iteration via Chrome + Figma, journey-scoped CSS |
| `forms-component-discovery` | `skills/forms-component-discovery/SKILL.md` | Discover registered components and their CSS file locations before styling |

---

### context-management
**Router:** `skills/forms-context-management/SKILL.md`
**Route when:** saving or loading session state, updating handover, logging sessions

| Skill | Path | Purpose |
|-------|------|---------|
| `forms-context-management` | `skills/forms-context-management/SKILL.md` | Read/write `$FORMS_WORKSPACE/.agent/handover.md`, history, session log — READ (silent) and WRITE (prompts user) |

---

## Skill Resolution — Plan Steps

When a plan step declares a skill:

1. Find the domain section above that contains the skill
2. Read the SKILL.md at the listed path
3. If the domain has a router → the router dispatches internally
4. If the domain has no router (`content-author`) → invoke the skill directly

**Hard stop:** skill or domain not found → halt, report error. Never guess or substitute.

---

## Forbidden Patterns

| Pattern | Why forbidden | Correct alternative |
|---------|--------------|---------------------|
| Direct PATCH to `properties/fd:rules` or `properties/fd:events` via Sites Content API | Bypasses `apply-rule-patch.bundle.js` merge logic; overwrites all existing rules and events silently | Use `forms-author` › `references/apply-rule-workflow.md` which calls `apply-rule-patch.bundle.js` |
| Setting `properties/validationExpression` via Sites Content API | Does not persist to JCR leaf node correctly | Use `curl POST <field-path> -F validationExpression=<formula>` — see `forms-rule-author` SKILL.md Step 12 for field-path format |

---

## Reference

| What | Where |
|------|-------|
| Domain SKILL.md template | `assets/TEMPLATE.md` |
| Guard rules for orchestrator | `assets/GUARDRAILS.md` |
