---
name: skill-resolution
description: >
  How plan steps resolve to domain skills. Used by the orchestrator
  when executing plan-driven workflows.
---

# Resolving a Plan Step to a Skill

When a plan step declares a skill, resolve it as follows:

1. Look up the **skill** in the Skills Catalog (`assets/skills-catalog.md`) → confirm it exists and find which domain owns it
2. Look up the **domain** in the Registry table (in `domains/SKILL.md`) → get the router path
3. Route to the domain's router SKILL.md → the domain router handles invocation

```
Plan step declares:
  skill: forms-rule-creator
       │
       ▼
Skills Catalog:
  #8: rule-creator › forms-rule-creator ✅ exists
       │
       ▼
Domain Registry:
  rule-creator → references/rule-creator/SKILL.md
       │
       ▼
Route to rule-creator/SKILL.md → invokes forms-rule-creator
```

If a plan step declares a skill that doesn't exist in the catalog, halt and report the error. Do not guess.

---

## Resolution Rules

1. **Exact match only** — the `domain` + `skill` pair must exist in the Skills Catalog. No fuzzy matching.
2. **Domain router delegates** — once resolved, the domain's SKILL.md handles actual skill invocation. This registry does not invoke skills directly.
3. **Missing skill = hard stop** — if the declared skill doesn't exist, halt execution and report the error to the user. Do not attempt to substitute a different skill.
4. **Missing domain = hard stop** — if the declared domain doesn't exist in the Registry, halt and report.