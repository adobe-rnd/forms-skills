---
name: forms-context-management
description: >
  Use when reading current journey state at session start (silent READ), or
  when saving session progress to $FORMS_WORKSPACE/.agent/handover.md (WRITE — always prompts user).
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.2"
  type: skill
  triggers:
    - update reports
    - save progress
    - handover
    - session log
    - agent memory
    - save state
    - session summary
    - context management
    - generate report
    - update report
    - update context
    - what did we do
    - progress report
    - track progress
---

# Context Manager

Manages `$FORMS_WORKSPACE/.agent/handover.md` — the agent's persistent state across sessions. Two distinct modes: READ (silent) and WRITE (always prompts).

---

## Modes

| Mode | When | User Prompt | Action |
|---|---|---|---|
| **READ** | Session start — orchestrator determines journey state | ❌ Never | Read `$FORMS_WORKSPACE/.agent/handover.md` silently, return state to caller |
| **WRITE** | After plan completes, user asks to save progress | ✅ Always | Prompt user, then write on confirmation |

**READ is always silent.** No announcement, no "I'm reading the handover", no output to user. Return state internally to the orchestrator.

**WRITE always prompts.** Never update `$FORMS_WORKSPACE/.agent/handover.md` without explicit user confirmation.

---

## When to Use

**READ mode:**
- Orchestrator session start — determine current state (FRESH / SPEC_READY / EXECUTING / COMPLETE)
- Orchestrator needs to know which plan is active and what step was last completed

**WRITE mode:**
- After a plan's acceptance criteria pass — offer to update handover
- User explicitly asks to save progress, update handover, or log the session
- At the end of a session when the user confirms they're done
- User asks "what did we do?" or "summarize this session"

---

## Files

| File | Purpose | Update Mode |
|------|---------|-------------|
| `$FORMS_WORKSPACE/.agent/handover.md` | Latest project state snapshot — what's done, what's pending, how to resume | Overwrite |
| `$FORMS_WORKSPACE/.agent/history.md` | Append-only archive of previous handover snapshots with timestamps | Append |
| `$FORMS_WORKSPACE/.agent/sessions.md` | Chronological session log — date, agent, session ID, summary | Append |

> **Agentic context note:** These files collectively form the agent's persistent memory. `$FORMS_WORKSPACE/.agent/handover.md` is the active state, `$FORMS_WORKSPACE/.agent/history.md` is the archive, and `$FORMS_WORKSPACE/.agent/sessions.md` is the audit trail.

All files live in `$FORMS_WORKSPACE/.agent/` at the workspace root.

---

## Guard Policies

After each plan completes, the orchestrator prompts **"Would you like me to update the project reports?"** — if confirmed, routes here; never updates silently.

---

## User Prompt

After a plan is executed or a significant milestone is reached, ask:

> **Would you like me to update the project reports?**
> This saves the current progress to `$FORMS_WORKSPACE/.agent/` so the next session can pick up where we left off.

Only proceed if the user confirms. If declined, skip silently — do not ask again until the next plan completes.

---

## Update Procedure

When the user confirms, execute these steps in order:

### Step 1 — Archive current handover

Read `$FORMS_WORKSPACE/.agent/handover.md`. If it exists and is non-empty, append its content to `$FORMS_WORKSPACE/.agent/history.md` with a timestamp header:

```
---
## Archived: YYYY-MM-DD HH:MM

<previous handover.md content>
```

If `$FORMS_WORKSPACE/.agent/handover.md` does not exist or is empty, skip this step.

### Step 2 — Write new handover

Overwrite `$FORMS_WORKSPACE/.agent/handover.md` with a fresh snapshot using this template:

```
# Handover

**Last updated:** YYYY-MM-DD HH:MM
**Workspace:** <workspace name>
**Journey:** <journey name>

---

## Analysis

- spec: journeys/<journey>/spec.md — `done` | `pending`
- api-refs: refs/apis/ — `done` | `pending` | `none`

---

## Plans

| Plan | Type | Status |
|---|---|---|
| 01-custom-component.md | Custom Component | `not-started` \| `in-progress` \| `complete` |
| 02-screen-01-<name>.md | Screen | `not-started` \| `in-progress` \| `complete` |

---

## Current

- Active plan: `NN-<name>.md` (or `none`)
- Last completed step: <step description or "—">

---

## Next

- <Explicit next action for orchestrator — one line>
```

Keep it concise — aim for ≤ 40 lines. Plans table is the primary dashboard.

When **analysis not yet done**, omit the Plans section entirely — orchestrator reads `analysis.spec: pending` and routes to FRESH state.

When **multiple journeys** exist, maintain one handover file per active journey and archive completed journeys to `$FORMS_WORKSPACE/.agent/history.md`.

### Step 3 — Log session

Append a row to `$FORMS_WORKSPACE/.agent/sessions.md`. If the file doesn't exist, create it with the header first:

```
# Session Log

| Date | Agent | Session ID | Summary |
|------|-------|------------|---------|
```

Then append the row:

```
| YYYY-MM-DD | <agent name> | <session ID or —> | <one-line summary of what was accomplished> |
```

If the session ID is not available, use `—`.

### Step 4 — Archive completed journey (if applicable)

When **all plans** for a journey show status ✅ Done:

1. **Build a journey completion record:**

```
---
## Journey Completed: <journey-name> — YYYY-MM-DD HH:MM

### Summary

| Metric | Value |
|--------|-------|
| Journey | <journey-name> |
| Plans executed | N |
| Start date | YYYY-MM-DD |
| Completion date | YYYY-MM-DD |
| Total screens | X |
| Total fields | X |
| Total rules | X |

### Plan Execution Log

| Plan | Title | Phase(s) | Summary |
|------|-------|----------|---------|
| 01 | <title> | Build | <summary> |

### Key Artifacts

| Artifact | Path |
|----------|------|
| Form JSON | `repo/content/forms/af/<team>/<path>/<name>.form.json` |
| Rule store | `repo/content/forms/af/<team>/<path>/<name>.rule.json` |
| Form script | `blocks/form/scripts/form/<name>.js` |
| Screen docs | `journeys/<journey>/screens/*/Screen.md` |

### Lessons / Notes

- <any notable decisions, workarounds, or technical debt>
```

2. **Append** this record to `$FORMS_WORKSPACE/.agent/history.md`
3. **Update** `$FORMS_WORKSPACE/.agent/handover.md`:
   - Move the journey's row in Journey Status to ✅ Done
   - Remove that journey's Plan Execution Status table
   - If another journey is queued, promote it to active
   - If no journeys remain, set Active journey to `—`

---

## Progress Report

When the user asks for a progress report or status update, generate a concise summary from the current handover state without modifying any files:

```
# Progress Report — <date>

**Workspace:** <workspace name>
**Active journey:** <journey name> | **Plan:** <current plan number>

## Completed This Session
<bullet list of what was accomplished>

## Current Status
<one paragraph: what's done, what's in progress, what's next>

## Pending Actions
<bullet list of remaining steps>
```

This is read-only — do NOT update `$FORMS_WORKSPACE/.agent/` files just because a progress report was requested. Only update on explicit confirmation.

---

## Reading Context (Session Start)

When starting a new session, if `$FORMS_WORKSPACE/.agent/handover.md` exists, read it to understand:
- What phase the project is in
- What was completed previously
- What's pending
- Key file locations

Do NOT read `$FORMS_WORKSPACE/.agent/history.md` or `$FORMS_WORKSPACE/.agent/sessions.md` unless the user asks about past sessions. They exist for traceability, not for routine context loading.

---

## Rules

1. **Always ask before writing.** Never update `$FORMS_WORKSPACE/.agent/` files without user confirmation.
2. **Handover must be concise.** No more than 60 lines. The Plans table is the primary dashboard — keep plan summaries to one line each.
3. **History is append-only.** Never modify or truncate `$FORMS_WORKSPACE/.agent/history.md`.
4. **Sessions is append-only.** Never modify or truncate `$FORMS_WORKSPACE/.agent/sessions.md`.
5. **No sensitive data.** Never write credentials, tokens, or secrets to `$FORMS_WORKSPACE/.agent/` files.
6. **Create if missing.** If any `$FORMS_WORKSPACE/.agent/` file doesn't exist, create it — don't error.
