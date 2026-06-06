---
name: forms-analysis
description: >
  Use when analyzing requirements to produce a journey spec — from requirements
  docs, screenshots, Figma, JUD, or v1 AEM form JSON. Output is
  journeys/<journey>/spec.md ready for the planner.
license: Apache-2.0
metadata:
  triggers:
    - analyze
    - requirements
    - create spec
    - plan form
    - journey spec
    - v1 form
    - legacy form
    - migrate
    - mockup
    - figma
    - screenshots
    - docx
  type: router
  author: Adobe
  version: "0.2"
---

# Analysis — Domain Router

Sequential pipeline that transforms raw inputs into a journey spec (`$FORMS_WORKSPACE/journeys/<journey>/spec.md`). This router does not implement — it delegates to sub-skills in order.

---

## Pipeline State Machine

```dot
digraph analysis_pipeline {
  rankdir=LR;
  node [shape=box];

  INTAKE    [shape=doublecircle, label="INTAKE"];
  EXTRACTING [label="EXTRACTING\nAPIs"];
  GENERATING [label="GENERATING\nSPEC"];
  DONE      [shape=doublecircle, label="DONE"];
  BLOCKED   [label="BLOCKED\n(input missing)"];

  INTAKE    -> BLOCKED    [label="input not found"];
  INTAKE    -> EXTRACTING [label="input confirmed"];
  BLOCKED   -> INTAKE     [label="user provides input"];
  EXTRACTING -> GENERATING [label="APIs written\nto refs/apis/"];
  GENERATING -> DONE      [label="spec.md written"];
}
```

| State | Action | Exit → Next |
|---|---|---|
| **INTAKE** | Confirm input exists on disk. Write inline input to `$FORMS_WORKSPACE/inputs/` if needed. For `.docx` → run `scripts/docx-to-text.py` first. | Input confirmed → EXTRACTING |
| **BLOCKED** | Input file not found or insufficient. Prompt user. | User provides → INTAKE |
| **EXTRACTING** | Scan input for API definitions (inline, attached files, cURL examples). Write each to `$FORMS_WORKSPACE/refs/apis/<name>.<ext>`. | APIs extracted → GENERATING |
| **GENERATING** | Invoke the appropriate sub-skill to produce `$FORMS_WORKSPACE/journeys/<journey>/spec.md`. | spec.md written → DONE |
| **DONE** | Return spec path to orchestrator. Orchestrator routes to planner. | — |

---

## Sub-Skill Routing (GENERATING state)

| Input type | Sub-skill |
|---|---|
| Requirements doc, inline text, journey.md | `analyze-requirements` |
| Screenshots, Figma frames, design mockups | `visual-analysis` |
| v1 AEM Adaptive Form JSON | `analyze-v1-form` |

First match wins. If multiple input types present, start with requirements doc — use visual analysis to fill gaps in screen structure.

---

## Sub-Skills

| # | Skill | Path | Purpose |
|---|---|---|---|
| 1 | `analyze-requirements` | `references/analyze-requirements/SKILL.md` | Parse requirements docs → journey spec |
| 2 | `visual-analysis` | `references/visual-analysis/SKILL.md` | Analyze visuals (screenshots, Figma) → journey spec sections |
| 3 | `analyze-v1-form` | `references/analyze-v1-form/SKILL.md` | Read v1 AEM form JSON → journey spec |

---

## Guard Policies

| Policy | Rule |
|---|---|
| `intake-gate` | Confirm input files exist on disk before routing. Never proceed with missing inputs. |
| `no-guessing-endpoints` | Never guess API endpoints. Mark unknowns as `TBD` in spec and `$FORMS_WORKSPACE/refs/apis/`. |
| `no-currentFormContext` | Never emit `PL.currentFormContext` references. Mark data sources as TBD instead. |
| `spec-convergence` | All paths converge to produce `$FORMS_WORKSPACE/journeys/<journey>/spec.md`. No sub-skill is done until spec.md is written. |
| `api-extraction-first` | Always extract and write API refs to `$FORMS_WORKSPACE/refs/apis/` before writing spec.md. Spec references files, not inline schemas. |
| `registry-aware-spec` | If `$FORMS_WORKSPACE/refs/component-registry.md` exists, read it at INTAKE state before routing to a sub-skill. Sub-skills must use the component palette when resolving field types. Never spec a Custom Component if a registered `fd:viewType` component matches the field intent (same input type, same interaction pattern) — use the existing component instead. |

---

## File Locations

| Asset | Path |
|---|---|
| Raw input documents | `$FORMS_WORKSPACE/inputs/` |
| Journey spec | `$FORMS_WORKSPACE/journeys/<journey>/spec.md` |
| API reference docs | `$FORMS_WORKSPACE/refs/apis/<name>.<ext>` |
| v1 form JSON | `$FORMS_WORKSPACE/refs/<form-name>.v1.json` |
| Screenshots / design files | `$FORMS_WORKSPACE/inputs/<journey>/` or `$FORMS_WORKSPACE/journeys/<journey>/` |
| `.docx` extraction script | `references/analyze-requirements/scripts/docx-to-text.py` |
| Component registry | `$FORMS_WORKSPACE/refs/component-registry.md` — written by `forms-component-discovery` at FRESH startup. Read at INTAKE state if present. |

---

## Reference Docs

| Doc | Path | Purpose |
|---|---|---|
| Task Types | `references/task-types.md` | Change-type classification — apply matching analysis questions and acceptance criteria format |
