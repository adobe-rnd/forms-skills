---
name: skills-catalog
description: >
  Complete catalog of all skills across all domains, plus intent-based routing
  for direct domain routing (no pipeline matched).
---

# Skills Catalog

All 16 skills across 6 domains.

| # | Domain | Skill | Purpose | Triggers |
|---|--------|-------|---------|----------|
| 1 | `analysis` | `analyze-requirements` | Parse requirements / mockups → form specification | analyze, requirements, create spec, plan form |
| 2 | `analysis` | `analyze-v1-form` | Read legacy v1 form JSON → Screen.md for migration | v1 form, legacy form, migrate, old form |
| 3 | `analysis` | `create-screen-doc` | Create standardized Screen.md (11-section format) | document screen, new screen doc |
| 4 | `analysis` | `review-screen-doc` | Validate Screen.md against form JSON (quality gate) | review screen, check screen, validate doc |
| 5 | `build` | `scaffold-form` | Bootstrap a new empty form template | scaffold, new form, bootstrap |
| 6 | `build` | `create-form` | Create / modify form JSON — fields, panels, fragments | create form, add field, add panel, modify form |
| 7 | `build` | `create-component` | Build custom components / extend OOTB field types | custom component, viewType, extend field |
| 8 | `logic` | `add-rules` | Add business rules (show/hide, validate, navigate, events) | add rule, show hide, validation, visibility |
| 9 | `logic` | `create-function` | Create custom JS functions (calculations, API calls) | custom function, calculation, JS function |
| 10 | `logic` | `optimize-rules` | Refactor & audit rules (visual vs function split) | optimize rules, refactor, too many rules |
| 11 | `integration` | `manage-apis` | Sync FDM, add API definitions, build JS clients | API, FDM, OpenAPI, cURL, api client |
| 12 | `infra` | `setup-workspace` | Initialize project, configure credentials | setup, workspace, credentials, initialize |
| 13 | `infra` | `sync-forms` | Pull / push / list / create forms on AEM | push form, pull form, sync form, form list |
| 14 | `infra` | `sync-eds-code` | Pull / push EDS code, branch, open PR on GitHub | push code, pull code, git push, PR |
| 15 | `infra` | `git-sandbox` | Sandboxed git operations (commit, push, reset) | git commit, git reset, git status |
| 16 | `context` | `manage-context` | Update project reports, save progress, session log | save progress, update reports, handover, session |

---

## Intent → Domain Routing

When the orchestrator falls through to direct domain routing (no pipeline matched), use this table. First match wins.

| User Intent Pattern | Domain | Typical Skills Invoked |
|---------------------|--------|------------------------|
| Setup, credentials, sync forms/code, git operations, deploy | `infra` | `setup-workspace`, `sync-forms`, `sync-eds-code`, `git-sandbox` |
| Analyze requirements, document screens, review docs, migrate v1 | `analysis` | `analyze-requirements`, `create-screen-doc`, `review-screen-doc`, `analyze-v1-form` |
| Scaffold form, create/modify form JSON, custom components | `build` | `scaffold-form`, `create-form`, `create-component` |
| Add rules, custom functions, optimize rules | `logic` | `add-rules`, `create-function`, `optimize-rules` |
| Sync/add/build APIs, FDM, OpenAPI | `integration` | `manage-apis` |
| Update reports, save progress, session log | `context` | `manage-context` |

> If the intent is ambiguous, present the top 2–3 matching domains to the user and let them choose.