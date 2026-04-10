---
name: build-journey
description: >
  End-to-end pipeline for building an AEM Forms journey from requirements to deployment.
  This is the default pipeline used by the Forms Orchestrator.
type: pipeline
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Pipeline: Build Journey

Build an AEM Forms journey end-to-end — from requirements intake through deployment.

---

## Pipeline Graph

```
                        ┌──────────────────────────┐
                        │  Phase 0: Setup           │
                        │  infra › setup-workspace  │
                        └────────────┬─────────────┘
                                     │
                              workspace ready?
                              ┌──yes──┘
                              │
                              ▼
                        ┌──────────────────────────────┐
                        │  Phase 1: Intake & Plan       │
                        │  analysis › analyze-requirements │
                        └────────────┬─────────────────┘
                                     │
                              spec approved?
                              ┌──yes──┘
                              │
                              ▼
                  ┌────────────────────────────────┐
                  │  Phase 2: Analyze & Document    │
                  │  analysis › create-screen-doc   │
                  │  analysis › review-screen-doc   │
                  └────────────┬───────────────────┘
                               │
                        complexity gate
                          ┌──pass──┘
                          │
                          ▼
            ┌─────────────────────────────┐
            │  Phase 3: Build             │
            │  build › create-form        │
            └──────────┬──────────────────┘
                       │
                       ▼
            ┌─────────────────────────────┐
            │  Phase 4: Integrate         │
            │  integration › manage-apis  │
            └──────────┬──────────────────┘
                       │
                       ▼
            ┌─────────────────────────────────────────────┐
            │  Phase 5: Logic                              │
            │  logic › add-rules / create-function         │
            └──────────┬──────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────────────────┐
            │  Phase 6: Deploy                              │
            │  infra › sync-forms / sync-eds-code           │
            └──────────┬───────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  ✅ Plan done    │──→ Post-plan checkpoint
              └────────┬────────┘
                       │
                more plans?
               ┌──yes──┘──no──┐
               │              │
               ▼              ▼
         next plan     ┌──────────────────┐
                       │ Journey complete  │
                       │ Archive to        │
                       │ .agent/history.md │
                       └──────────────────┘
```

> Not every plan exercises every phase. A Build plan runs Phase 3 + 6. A Logic plan runs Phase 5 + 6. An Integration plan runs Phase 4 + 5 + 6. The graph shows the full phase order; individual plans enter at their starting phase and exit through Deploy.

---

## Phase Definitions

### Phase 0 — Setup

| Property | Value |
|----------|-------|
| **Domain** | `infra` |
| **Skill** | `setup-workspace` |
| **Input** | Workspace name |
| **Output** | Workspace directory + `.env` with credentials |
| **Gate** | Must complete before any other phase runs |

Creates the workspace directory structure, collects AEM/GitHub credentials interactively, writes `FORMS_WORKSPACE` and all credentials to `.env`, and verifies connectivity.

> **Phase 0 gate:** If no workspace has been set up yet, route here before doing anything else.

---

### Phase 1 — Intake & Plan

| Property | Value |
|----------|-------|
| **Domain** | `analysis` |
| **Skill** | `analyze-requirements` |
| **Input** | User prompt + requirements doc / journey.md / screenshots / v1 JSON |
| **Output** | Form Specification + execution plans at `plans/<journey>/` |
| **Gate** | Input files must be confirmed on disk before analysis begins |

1. Confirms input source and files in workspace
2. Produces a Form Specification with complexity checks (Summary & Complexity section)
3. Generates sequentially numbered plan files at `plans/<journey>/`

---

### Phase 2 — Analyze & Document

| Property | Value |
|----------|-------|
| **Domain** | `analysis` |
| **Skills** | `create-screen-doc`, `review-screen-doc` |
| **Input** | Source files (requirements, screenshots, v1 JSON) |
| **Output** | Validated `Screen.md` per screen at `journeys/<journey>/screens/<screen>/Screen.md` |
| **Gate** | Complexity gate — all Screen.md files must pass complexity thresholds (🟢/🟡). 🔴 blocks build. |

All Screen.md files pass through `review-screen-doc` (quality gate) before leaving this phase.

---

### Phase 3 — Build

| Property | Value |
|----------|-------|
| **Domain** | `build` |
| **Skill** | `create-form` |
| **Input** | Screen.md files |
| **Output** | `form.json` + `rule.json` + custom components |
| **Gate** | Form must pass `eds-form-validator` |

Builds the form JSON from the field inventory and panel structure defined in Screen.md documents.

---

### Phase 4 — Integrate

| Property | Value |
|----------|-------|
| **Domain** | `integration` |
| **Skill** | `manage-apis` |
| **Input** | AEM FDM / cURL / OpenAPI specs |
| **Output** | JS API clients at `code/blocks/form/api-clients/` |
| **Gate** | API clients must be syntactically valid JS |

Generates JavaScript API client wrappers from API definitions. Clients are staged in `refs/apis/api-clients/` then deployed to `code/blocks/form/api-clients/`.

---

### Phase 5 — Logic

| Property | Value |
|----------|-------|
| **Domain** | `logic` |
| **Skills** | `add-rules`, `create-function`, `optimize-rules` |
| **Input** | Screen.md + form.json + API clients |
| **Output** | Updated `rule.json` + custom functions at `code/blocks/form/scripts/` |
| **Gate** | Rules must compile without errors via rule-coder bridge |

Implements validation rules, visibility rules, business rules, and custom functions. Fragment scripts are authored in `code/blocks/form/scripts/fragment/` and re-exported from the form-level script.

---

### Phase 6 — Deploy

| Property | Value |
|----------|-------|
| **Domain** | `infra` |
| **Skills** | `sync-forms`, `sync-eds-code` |
| **Input** | Completed form + code |
| **Output** | Form pushed to AEM Author + code pushed to GitHub via PR |
| **Gate** | PR must be reviewed and merged before next plan starts |

Deployment targets:
- **AEM forms** — `form-sync push <form_path>` for each changed form/rule file
- **EDS code** — `eds-code-sync push --branch <branch-name> --pr` → user reviews and merges → `eds-code-sync sync` to re-sync local

---

## Post-Plan Checkpoint

After each plan completes, present the user with these options. All local changes are preserved regardless of choice — skipped deployments can be done later at any time.

> *"This plan is complete. How would you like to proceed?"*

| Option | Deploy? | Update Reports? | Next Action |
|--------|---------|-----------------|-------------|
| **1. Deploy and update reports** | ✅ | ✅ | Deploy all changes, then update `.agent/` reports |
| **2. Update reports only** | ❌ | ✅ | Skip deployment, update `.agent/` reports |
| **3. Update reports and proceed** | ❌ | ✅ | Update `.agent/` reports, then start next plan |
| **4. Proceed to next plan** | ❌ | ❌ | Skip both, start next plan immediately |

**When deploying (option 1):**
- **AEM forms** — If any form or rule files were created or modified (in `repo/`), push them to AEM Author with `form-sync push <form_path>` for each changed form.
- **EDS code** — If any files in the `code/` directory were created or modified, push them to GitHub with `eds-code-sync push --branch <branch-name> --pr`. Ask the user to review and merge the PR. Once the user confirms the merge, run `eds-code-sync sync` to re-sync the local `code/` directory with the merged main branch before proceeding.

**When updating reports (options 1, 2, 3):** Route to `context` → `manage-context` to update `.agent/handover.md`, `.agent/history.md`, and `.agent/sessions.md`.

---

## Plan-Driven Execution

The pipeline phases define HOW to build. Plans define WHAT to build and in what order.

### Plan Lifecycle

```
Journey requirements
       │
       ▼
 analyze-requirements (Phase 1)
       │
       ├──→ Form Specification (with complexity checks)
       │
       ▼
 plans/<journey>/
 ├── 01-form-structure.md     ──→ Phase 3 (Build)       ──→ Deploy checkpoint
 ├── 02-screen-logic.md       ──→ Phase 5 (Logic)       ──→ Deploy checkpoint
 ├── 03-api-integration.md    ──→ Phase 4+5 (Integrate)  ──→ Deploy checkpoint
 └── ...
       │
       ▼
 All plans ✅ → Journey complete → Archive to .agent/history.md
```

### Rules

1. **Plans are generated in Phase 1** by `analyze-requirements` after the form specification is approved
2. **Plans execute sequentially** — each plan triggers one or more pipeline phases
3. **Post-plan checkpoint** applies after each plan completes (not after each phase within a plan)
4. **Plan status is tracked** in `.agent/handover.md` via the Plan Execution Status dashboard
5. **Journey completion** triggers archival to `.agent/history.md` via `manage-context`
6. **Max 15 plans per journey** — if more are needed, the journey is likely too complex

### Plan File Convention

- **Path:** `plans/<journey>/NN-<short-title>.md`
- **Numbering:** Zero-padded two digits: `01`, `02`, ..., `10`, `11`
- **Template and decomposition guidelines:** See `analyze-requirements` skill