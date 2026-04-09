---
name: forms-orchestrator
description: >
  Skill Gateway for AEM Forms. Routes user intents to domain routers.
  Defines the phased request pipeline from requirements to deployment.
  Triggers: plan, workflow, how to build, end to end, phases, orchestrate,
  what skill, which skill, next step, getting started, build a form, route.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.5"
---

# Forms Orchestrator — Skill Gateway

Routes user intents to the correct domain. Each domain owns its own skill-level routing, guard policies, and file conventions.

> This gateway routes to domains — domains route to skills — skills implement.

---

## Domain Routing

| Intent | Domain |
|--------|--------|
| Setup, credentials, sync forms/code, git operations, deploy | `infra` |
| Analyze requirements, document screens, review docs, migrate v1 | `analysis` |
| Scaffold form, create/modify form JSON, custom components | `build` |
| Add rules, custom functions, optimize rules | `logic` |
| Sync/add/build APIs, FDM, OpenAPI | `integration` |
| Update reports, save progress, session log | `context` |
| "How do I build a form?" / "What do I do next?" | → Return **Pipeline** below |

---

## Request Pipeline

Phases execute in order. Each phase feeds the next.

| Phase | Name | Domain | Skill | Input → Output |
|-------|------|--------|-------|-----------------|
| **0** | Setup | `infra` | `setup-workspace` | Workspace name → workspace directory + `.env` with credentials |
| **1** | Intake & Plan | `analysis` | `analyze-requirements` | User prompt → confirmed input source + files in workspace |
| **2** | Analyze & Document | `analysis` | `create-screen-doc` | Source files → validated Screen.md per screen |
| **3** | Build | `build` | `create-form` | Screen.md → form.json + rule.json + components |
| **4** | Integrate | `integration` | `manage-apis` | AEM FDM / cURL / OpenAPI → JS API clients |
| **5** | Logic | `logic` | `add-rules` | Screen.md + form.json + API clients → rules + functions |
| **6** | Deploy | `infra` | `sync-forms` / `sync-eds-code` | Completed form + code → pushed to AEM + GitHub PR |

> **Post-phase checkpoint:** After each phase completes, present the user with the following options. All local changes are preserved regardless of choice — skipped deployments can be done later at any time (e.g., as a batch deployment after multiple phases).
>
> *"This phase is complete. How would you like to proceed?"*
>
> 1. **Deploy and update reports** — Deploy all changes (AEM + EDS as applicable), then update `.agent/` project reports.
> 2. **Update reports only** — Skip deployment, update `.agent/` project reports.
> 3. **Update reports and proceed to next plan** — Skip deployment, update `.agent/` project reports, then immediately start implementing the next plan/step.
> 4. **Proceed to next plan** — Skip both deployment and reports, immediately start implementing the next plan/step.
>
> **When deploying (options 1):**
> - **AEM forms** — If any form or rule files were created or modified (in `form/` or `repo/`), push them to AEM Author with `form-sync push <form_path>` for each changed form.
> - **EDS code** — If any files in the `code/` directory were created or modified, push them to GitHub with `eds-code-sync push --branch <branch-name> --pr`. Ask the user to review and merge the PR. Once the user confirms the merge, run `eds-code-sync sync` to re-sync the local `code/` directory with the merged main branch before proceeding.
>
> **When updating reports (options 1, 2, 3):** Route to `context` → `manage-context` to update `.agent/handover.md`, `.agent/history.md`, and `.agent/sessions.md`.

> **Phase 0 gate:** If no workspace has been set up yet, route to `infra` → `setup-workspace` before doing anything else. The setup skill handles the entire interactive flow — asking for a workspace name, creating the directory, collecting credentials one by one, writing `FORMS_WORKSPACE` and all credentials to `.env`, and verifying connectivity.

---

## Workspace Resolution

All CLI tools shipped with this plugin auto-resolve the user's workspace directory before running. Every tool sources `bin/_resolve-workspace` which ensures `.env`, `metadata.json`, `sandbox.json`, and all workspace directories are found correctly — even when the agent invokes a command from a different directory.

**Resolution order (first match wins):**

1. **`FORMS_WORKSPACE` already in environment** — e.g. exported by the caller
2. **`FORMS_WORKSPACE` read from `.env` in cwd** — written by the `setup-workspace` skill during Phase 0
3. **Fall back to cwd** — backwards-compatible default

---

## Reference

### Config Files

| File | Managed By | Purpose |
|------|------------|---------|
| `.env` | `setup-workspace` | `FORMS_WORKSPACE` path + AEM/GitHub credentials — never commit |
| `metadata.json` | `sync-forms` | Tracks synced form/fragment paths (AEM ↔ local) |
| `sandbox.json` | `git-sandbox` | Restricts allowed commit paths and push branch names |

### File Locations

| What | Where |
|------|-------|
| Forms | `repo/content/forms/af/<team>/<path>/<name>.form.json` |
| Rule stores | `repo/content/forms/af/<team>/<path>/<name>.rule.json` |
| Fragment scripts | `code/blocks/form/scripts/fragment/<fragment>.js` |
| Form-level scripts | `code/blocks/form/scripts/form/<form>.js` |
| Shared libraries | `code/blocks/form/scripts/script-libs/libs.js` |
| API clients (live) | `code/blocks/form/api-clients/` |
| API clients (staging) | `refs/apis/api-clients/` |
| API definitions | `refs/apis/` |
| Screen docs | `journeys/<journey>/screens/<screen>/Screen.md` |
| Custom components | `code/components/<view-type>/` |
| Agent memory | `.agent/handover.md`, `.agent/history.md`, `.agent/sessions.md` |