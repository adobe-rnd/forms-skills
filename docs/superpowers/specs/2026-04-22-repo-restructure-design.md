# Repo Restructure Design
**Date:** 2026-04-22
**Branch:** addn-fixes-refactor

---

## Goal

Remove the implicit "plugin-as-distribution" model in favour of a first-class skillpack workspace, collapse the routing invocation chain for performance, and clean up the repo root.

---

## Changes in Scope

### 1. Move all skill modules under `skills/`

All 8 `forms-*` directories move from the repo root into a `skills/` directory. Internal structure of each module is **unchanged**.

```
forms-analysis/       →  skills/forms-analysis/
forms-build/          →  skills/forms-build/
forms-context/        →  skills/forms-context/
forms-infra/          →  skills/forms-infra/
forms-integration/    →  skills/forms-integration/
forms-logic/          →  skills/forms-logic/
forms-orchestrator/   →  skills/forms-orchestrator/
forms-shared/         →  skills/forms-shared/
```

### 2. Add `workspace.yaml` at repo root

New skillpack workspace manifest. Lists only the 18 true skills — the 9 converted references (see §6) are excluded.

```yaml
skillpack: "1.0"
name: forms-skills

skills:
  - skills/forms-orchestrator
  - skills/forms-orchestrator/references/planner
  - skills/forms-analysis/references/analyze-requirements
  - skills/forms-analysis/references/analyze-v1-form
  - skills/forms-analysis/references/create-screen-doc
  - skills/forms-analysis/references/jud-to-screen
  - skills/forms-build/references/scaffold-form
  - skills/forms-build/references/create-form
  - skills/forms-build/references/create-component
  - skills/forms-logic/references/add-rules
  - skills/forms-logic/references/create-function
  - skills/forms-logic/references/optimize-rules
  - skills/forms-infra/references/setup-workspace
  - skills/forms-infra/references/sync-forms
  - skills/forms-infra/references/sync-eds-code
  - skills/forms-infra/references/git-sandbox
  - skills/forms-integration/references/manage-apis
  - skills/forms-context/references/manage-context
```

### 3. Update `.claude-plugin/plugin.json` (kept for plugin support)

Paths updated from `./forms-*/` to `./skills/forms-*/`. Skill list mirrors `workspace.yaml` exactly — same 18 entries, same exclusions.

### 4. Root file moves

| File | Action |
|------|--------|
| `.envrc.example` | → `skills/forms-infra/.envrc.example` |
| `pyproject.toml` | Stays at root — aggregates Python scripts from multiple modules. All `forms-*/` path references updated to `skills/forms-*/`. |
| `LICENSE` | Kept at root |
| `dist/` | Kept at root |

### 5. `package.json` script updates

**validate** — path glob updated:
```json
"validate": "find skills/ -name SKILL.md -not -path '*/.venv/*' -exec dirname {} \\; | xargs -I {} skills-ref validate {}"
```

**evals** — unchanged for now. `crispy-garbanzo --plugin .` reads `.claude-plugin/plugin.json` which is kept. Tracked as follow-up: migrate to tessl or add `--workspace` support to crispy-garbanzo.

---

### 6. Routing optimisation — 9 SKILL.md → plain references

**Motivation:** the routing chain currently stacks 3 SKILL invocations before any real work begins. The routing/catalog tier is pure lookup with no procedural flow.

**Before:**
```
orchestrator SKILL → domain-registry SKILL → domain SKILL → leaf SKILL
```

**After:**
```
orchestrator SKILL → Read domain-registry file → Read domain file → leaf SKILL
```

**Mechanism:** these 9 files keep the `SKILL.md` filename for tool compatibility (skillpack pack/validate expect it). They are simply removed from `workspace.yaml` and `.claude-plugin/plugin.json` so the runtime does not advertise or auto-load them as invocable skills. The orchestrator's routing instructions are updated to use the Read tool on these files instead of the Skill tool.

**Files converted to read-only references:**

| File | Reason |
|------|--------|
| `skills/forms-orchestrator/references/domain-registry/SKILL.md` | Master domain catalog, pure lookup |
| `skills/forms-analysis/SKILL.md` | Routing table + skill catalog |
| `skills/forms-build/SKILL.md` | Routing table + skill catalog |
| `skills/forms-logic/SKILL.md` | Routing table + skill catalog |
| `skills/forms-infra/SKILL.md` | Routing table + skill catalog |
| `skills/forms-integration/SKILL.md` | Routing table + skill catalog |
| `skills/forms-context/SKILL.md` | Routing table + skill catalog |
| `skills/forms-shared/SKILL.md` | Lists available CLI tools, no procedure |
| `skills/forms-analysis/references/review-screen-doc/SKILL.md` | Review checklist, reference material |

**Alongside the conversion:**
- `skills/forms-orchestrator/SKILL.md` updated: routing instructions changed from "invoke Skill" to "Read file" for the domain-registry and domain-level files
- `skills/forms-orchestrator/assets/routing-table.md` updated: same change for the service tier

---

## Entry Point

`skills/forms-orchestrator/SKILL.md` is the single agent entry point — the only skill triggered directly by the user. All routing, domain dispatch, and leaf skill invocation flows through it.

---

## What Does NOT Change

- Internal structure of every `forms-*` module (assets/, references/, scripts/ layout)
- `SKILL.md` content of all 18 true skills
- `DEPS.yaml` files — dependency resolution is name-based, unaffected by directory move
- All SKILL.md internal relative path references (`references/planner/SKILL.md`, etc.)
- `renovate.json`, `.github/`, `.gitignore`, `README.md`, `package-lock.json`, `.npmrc`

---

## Out of Scope (follow-up)

- **Tessl migration**: replace `crispy-garbanzo` evals (8 scenarios across 3 skills) with `tessl eval run` — requires rewriting scenarios to tessl format and setting up workspace credentials in CI
- **crispy-garbanzo `--workspace` support**: add `--workspace workspace.yaml` flag so evals can fully drop the `--plugin` dependency

---

## Build Command (unchanged mechanics, new path)

```sh
skillpack pack --embed-deps skills/forms-orchestrator -v <version>
```
