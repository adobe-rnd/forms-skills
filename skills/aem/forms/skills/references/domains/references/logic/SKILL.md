---
name: logic
description: >
  Domain router for business-rules & custom-function skills
type: domain
triggers:
  - add rule
  - show hide
  - validate
  - navigate
  - event
  - business logic
  - custom function
  - calculation
  - optimize rules
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Logic — Domain Router

**ID:** `logic`
**Version:** 0.1
**Description:** Domain router for business-rules & custom-function skills

This router does not implement — it delegates. It matches user intents to the correct skill within this domain.

---

## Routing Table

First match wins.

| Intent | Examples | Skill |
|--------|----------|-------|
| Add rule | "show/hide", "enable/disable", "set value", "validate", "navigate", "dispatch event", "business logic" | `add-rules` |
| Create custom JS function | "calculation", "API call function", "data transformation" | `create-function` |
| Optimize / refactor rules | "visual vs function split", "rule audit" | `optimize-rules` |

> If the intent is ambiguous between two skills, present the options to the user and let them choose.

---

## Skills

All skills owned by this domain.

| # | Skill | Purpose | Triggers |
|---|-------|---------|----------|
| 1 | `add-rules` | Add business rules (show/hide, validate, navigate, events) | add rule, show hide, validate, navigate, event, business logic |
| 2 | `create-function` | Create custom JS functions (calculations, API calls) | custom function, calculation |
| 3 | `optimize-rules` | Refactor & audit rules (visual vs function split) | optimize rules |

### Skill Locations

| Skill | Path |
|-------|------|
| `add-rules` | [`references/add-rules/SKILL.md`](references/add-rules/SKILL.md) |
| `create-function` | [`references/create-function/SKILL.md`](references/create-function/SKILL.md) |
| `optimize-rules` | [`references/optimize-rules/SKILL.md`](references/optimize-rules/SKILL.md) |

---

## Guard Policies

Guard policies are constraints that apply across all skills in this domain. They prevent unsafe or incorrect operations.

> **no-direct-rule-edits:** Never edit `.rule.json` / `fd:events` directly. Never invoke `rule-validate`, `rule-save`, `rule-transform` outside `add-rules`. All business logic → `add-rules`.

> **no-direct-function-writes:** Never write custom-function JS without `create-function`. It ensures JSDoc, exports, and parser compatibility.

---

## File Locations

Canonical paths for assets managed by skills in this domain.

| Asset | Path |
|-------|------|
| Rule stores | `repo/content/forms/af/<team>/<path>/<name>.rule.json` |
| Fragment scripts | `code/blocks/form/scripts/fragment/<fragment>.js` |
| Form-level scripts | `code/blocks/form/scripts/form/<form>.js` |
| Shared libraries | `code/blocks/form/scripts/script-libs/libs.js` |

---

## Dependencies

Other domains or skills that this domain's skills may delegate to or depend on.

| Dependency | Direction | Reason |
|------------|-----------|--------|
| `build` | `build` → This domain | Form JSON must exist before rules can be added |

---

## Pipeline Integration

How this domain participates in pipeline-driven execution.

| Pipeline | Phase(s) | Skill(s) Invoked |
|----------|----------|------------------|
| `build-journey` | Phase 3: Add Rules | `add-rules` |
| `build-journey` | Phase 4: Create Functions | `create-function` |

---

## Extending This Domain

### Adding a New Skill

1. Create the skill folder: `references/logic/references/<skill-name>/`
2. Add a `SKILL.md` inside the skill folder — this is the skill's entry point
3. Add the skill to the **Routing Table** above with its intent patterns
4. Add the skill to the **Skills** table and **Skill Locations** table above
5. Register the skill in the domain registry (`domains/SKILL.md`) — both the **Skills Catalog** and **Intent → Domain Routing** tables
6. If the skill manages new file types, add them to the **File Locations** table
7. If needed, add guard policies that apply to the new skill