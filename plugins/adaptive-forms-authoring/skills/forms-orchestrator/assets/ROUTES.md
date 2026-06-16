# Orchestrator State Machine

Every session starts with a silent context read. No user prompt until a user-facing action is needed.

---

## State Machine

```dot
digraph orchestrator {
  rankdir=LR;
  node [shape=box];

  INIT [shape=doublecircle, label="INIT\n(session start)"];
  COMPLETE [shape=doublecircle, label="COMPLETE"];
  WORKSPACE_MISSING [label="WORKSPACE\nMISSING"];
  FRESH [label="FRESH\n(no spec)"];
  SPEC_READY [label="SPEC_READY\n(no plans)"];
  EXECUTING [label="EXECUTING(N)"];
  BLOCKED [label="BLOCKED"];
  SINGLE_TASK [label="SINGLE_TASK"];

  INIT -> WORKSPACE_MISSING [label="no workspace"];
  INIT -> FRESH          [label="workspace OK\nno spec"];
  INIT -> SPEC_READY     [label="spec exists\nno plans"];
  INIT -> EXECUTING      [label="plans exist\nsome pending"];
  INIT -> COMPLETE       [label="all plans done"];
  INIT -> SINGLE_TASK    [label="isolated task\nno journey"];

  WORKSPACE_MISSING -> INIT   [label="setup complete"];
  FRESH      -> SPEC_READY    [label="spec.md written\nAPIs extracted"];
  SPEC_READY -> EXECUTING     [label="plans generated"];
  EXECUTING  -> EXECUTING     [label="plan N+1\nnot started"];
  EXECUTING  -> BLOCKED       [label="acceptance\ncriteria fail"];
  BLOCKED    -> EXECUTING     [label="user resolves\nissue"];
  EXECUTING  -> COMPLETE      [label="last plan done"];
  SINGLE_TASK -> INIT         [label="task complete"];
}
```

| State | Condition | Entry Action | Exit → Next State |
|---|---|---|---|
| **INIT** | Session start | Read `.agent/handover.md` silently (forms-context-management READ — no user prompt) | Determine state from table below |
| **WORKSPACE_MISSING** | `FORMS_WORKSPACE` not set, no `.env` | Read `assets/SETUP.md` inline — hard gate, nothing else runs | Setup done → INIT |
| **FRESH** | No `$FORMS_WORKSPACE/journeys/<j>/spec.md` | Run component-inventory (conditional) then invoke `forms-analysis` — see FRESH → SPEC_READY section for decision logic. | spec.md written + APIs extracted → SPEC_READY |
| **SPEC_READY** | spec.md exists, no plans yet | Invoke `references/planner/SKILL.md` | Plans written to `$FORMS_WORKSPACE/journeys/<j>/plans/` → EXECUTING(1) |
| **EXECUTING(N)** | Plan N not complete | Execute plan N step by step | Acceptance criteria pass → EXECUTING(N+1) or COMPLETE |
| **BLOCKED** | Plan N acceptance criteria fail | Report to user, await resolution | User resolves → resume EXECUTING(N) |
| **COMPLETE** | All plans ✅ done | Report journey complete to user | Terminal |
| **SINGLE_TASK** | Isolated intent, no journey context | Route to domain via domain registry | Task done → INIT |

---

## INIT — State Determination

After silent `handover.md` read, determine state:

| `handover.md` condition | → State |
|---|---|
| File missing or empty | FRESH |
| `analysis.spec: pending` | FRESH |
| `analysis.spec: done`, no plans generated | SPEC_READY |
| Plans exist, plan N `in-progress` | EXECUTING(N) — resume at last incomplete step |
| Plans exist, plan N-1 `complete`, plan N `not-started` | EXECUTING(N) — start plan N |
| All plans `complete` | COMPLETE |
| User intent is isolated task (no journey) | SINGLE_TASK |

> **Workspace gate (always first):** Before any state transition, verify `FORMS_WORKSPACE` is set or `.env` exists. Missing → WORKSPACE_MISSING. Nothing else runs until workspace is resolved.

---

## Pre-Flight Connectivity Check

Run once per session after workspace confirmed, before first AEM operation. Skip if resuming an active plan mid-execution.

```bash
source .skills-workspace/.env && \
  curl -sf -o /dev/null -H "Authorization: Bearer $AEM_TOKEN" "${AEM_HOST}/api/assets.json" \
  && echo "AEM OK" || echo "AEM FAIL"
```

| Result | Action |
|---|---|
| ✅ AEM OK | Proceed |
| ❌ 401 Unauthorized | Tell user: "AEM bearer token expired. Regenerate from AEM Developer Console → Integrations → Local Token, paste into `.env` as `AEM_TOKEN`." Wait — do not proceed. |
| ❌ Other failure | Diagnose (wrong host, network unreachable). Report with specific action required. Do not proceed until resolved. |

---

## FRESH → SPEC_READY

### Step 1 — Component Inventory (conditional)

Before invoking `forms-analysis`, run `forms-component-discovery` to populate the component palette:

| Condition | Action |
|---|---|
| `$FORMS_WORKSPACE/refs/component-registry.md` exists | Skip — registry already populated |
| `$FORMS_EDS_ROOT/blocks/form/mappings.js` absent | Skip — OOTB-only project, no custom components |
| Neither skip condition met | Run `forms-component-discovery` → write `$FORMS_WORKSPACE/refs/component-registry.md` |

`forms-analysis` proceeds after Step 1 regardless of registry content — an empty registry (no custom components) is a valid state.

### Step 2 — Analysis

Invoke `forms-analysis` skill.

| Input type | Handling |
|---|---|
| Requirements doc in `$FORMS_WORKSPACE/inputs/` | Read directly |
| Inline from user | Write to `$FORMS_WORKSPACE/inputs/<name>.md` first, then read |
| `.docx` file | Run `scripts/docx-to-text.py` first, then analyze |
| Screenshots / Figma / mockups | Route to `visual-analysis` |
| v1 AEM form JSON | Route to `analyze-v1-form` |

Outputs written by forms-analysis:
- `$FORMS_WORKSPACE/journeys/<journey>/spec.md` — journey specification
- `$FORMS_WORKSPACE/refs/apis/<name>.<ext>` — one file per API found in requirements

---

## SPEC_READY → EXECUTING

Invoke `references/planner/SKILL.md`.

- Input: `$FORMS_WORKSPACE/journeys/<journey>/spec.md`
- Output: `$FORMS_WORKSPACE/journeys/<journey>/plans/NN-*.md`

Planner reads spec → identifies which plan types apply → writes numbered plan files in dependency order.

---

## EXECUTING(N) — Plan Execution Flow

```
Read journeys/<journey>/plans/NN-<title>.md
  │
  ▼
Find current step:
  ├── New plan     → first step
  └── Resumed plan → first step where [ ] not ticked
  │
  ▼
Resolve skill via references/domain-registry/SKILL.md
  │
  ▼
Execute step → mark step complete (tick [ ])
  │
  ▼
All steps done?
  ├── No  → next step
  └── Yes → Plan Completion Gate (assets/GUARDRAILS.md)
              Verify EVERY - [ ] criterion against live form state
              Check all Deferred Items assigned to this plan are resolved
              ├── All pass → mark plan ✅ complete
              │             route to context-management domain via domain-registry
              │             → forms-context-management SKILL.md WRITE mode (prompts user before writing)
              │             → EXECUTING(N+1) or COMPLETE
              └── Any fail → BLOCKED → report to user
```

---

## SINGLE_TASK — Domain Fallback

For isolated tasks with no journey context. First match wins.

| Intent | Domain / Skill |
|---|---|
| Analyze requirements, migrate v1, visuals → spec | `forms-analysis` |
| Create form, add / modify / delete fields, panels | `forms-author`, `forms-content-modeler` |
| Custom component, extend field, fd:viewType block | `forms-custom-components` |
| Component inventory, what components exist | `forms-component-discovery` |
| Style, theme, CSS, colors, typography, layout, border | `forms-style-screen`, `forms-component-discovery` |
| Add rules, show/hide, validate, calculate | `forms-rule-author` |
| Add / build APIs, OpenAPI, cURL | `forms-integration` |
| Save progress, update handover | `forms-context-management` |

No match → ask user to clarify. Never guess.

---

## manage-context Modes

| Mode | Trigger | User Prompt? |
|---|---|---|
| **READ** | INIT — every session start, determine state | ❌ Silent — no announcement, no prompt |
| **WRITE** | After plan completes, user requests save | ✅ Always prompt before writing |
