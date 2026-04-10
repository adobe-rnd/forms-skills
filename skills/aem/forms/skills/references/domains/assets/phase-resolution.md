---
name: phase-resolution
description: >
  How pipeline phases resolve to domain skills. Used by the orchestrator
  when executing pipeline-driven workflows.
---

# Resolving a Pipeline Phase

When a pipeline phase declares a domain and skill, resolve it as follows:

1. Look up the **domain** in the Registry table (in `domains/SKILL.md`) → get the router path
2. Look up the **skill** in the Skills Catalog (`assets/skills-catalog.md`) → confirm it exists in that domain
3. Route to the domain's router SKILL.md → the domain router handles invocation

```
Pipeline phase declares:
  domain: logic
  skill: add-rules
       │
       ▼
Domain Registry:
  logic → references/logic/SKILL.md
       │
       ▼
Skills Catalog:
  #8: logic › add-rules ✅ exists
       │
       ▼
Route to logic/SKILL.md → invokes add-rules
```

If a phase declares a skill that doesn't exist in the catalog, halt and report the error. Do not guess.

---

## Resolution Rules

1. **Exact match only** — the `domain` + `skill` pair must exist in the Skills Catalog. No fuzzy matching.
2. **Domain router delegates** — once resolved, the domain's SKILL.md handles actual skill invocation. This registry does not invoke skills directly.
3. **Missing skill = hard stop** — if the declared skill doesn't exist, halt the pipeline and report the error to the user. Do not attempt to substitute a different skill.
4. **Missing domain = hard stop** — if the declared domain doesn't exist in the Registry, halt and report.