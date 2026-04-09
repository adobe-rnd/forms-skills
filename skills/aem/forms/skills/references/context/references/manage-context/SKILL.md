---
name: manage-context
description: >
  Manages agent memory files in the .agent/ workspace directory — handover.md,
  history.md, and sessions.md. Maintains continuity across sessions by capturing
  project state, archiving history, and logging session activity. Opt-in —
  prompts the user before updating.
  Triggers: update context, save progress, handover, session log, agent memory,
  update reports, save state, what did we do, session summary.
license: Apache-2.0
metadata:
  author: Adobe
  version: "0.1"
---

# Context Manager

Manages the `.agent/` directory — the agent's memory across sessions.

---

## When to Use

- After executing or implementing a plan (prompt the user first)
- User explicitly asks to save progress, update handover, or log the session
- At the end of a session when the user confirms they're done
- User asks "what did we do?" or "summarize this session"

**Do NOT** update `.agent/` files silently. Always ask the user first.

---

## Files

| File | Purpose | Update Mode |
|------|---------|-------------|
| `handover.md` | Latest project state snapshot — what's done, what's pending, how to resume | Overwrite |
| `history.md` | Append-only archive of previous handover snapshots with timestamps | Append |
| `sessions.md` | Chronological session log — date, agent, session ID, summary | Append |

All files live in `.agent/` at the workspace root.

---

## User Prompt

After a plan is executed or a significant milestone is reached, ask:

> **Would you like me to update the project reports?**
> This saves the current progress to `.agent/` so the next session can pick up where we left off.

Only proceed if the user confirms. If declined, skip silently — do not ask again until the next plan completes.

---

## Update Procedure

When the user confirms, execute these steps in order:

### Step 1 — Archive current handover

Read `.agent/handover.md`. If it exists and is non-empty, append its content to `.agent/history.md` with a timestamp header:

```
---
## Archived: YYYY-MM-DD HH:MM

<previous handover.md content>
```

If `handover.md` does not exist or is empty, skip this step.

### Step 2 — Write new handover

Overwrite `.agent/handover.md` with a fresh snapshot using this template:

```
# Project Handover

**Last updated:** YYYY-MM-DD HH:MM
**Last phase completed:** <phase name>

## Current State

<1-2 sentence summary of where the project stands>

## What's Done

- <completed item 1>
- <completed item 2>
- ...

## What's Pending

- <next step 1>
- <next step 2>
- ...

## Key Files

| File | Status | Notes |
|------|--------|-------|
| <path> | <created/modified/pending> | <brief note> |

## How to Resume

<1-2 sentences on what to do next — which phase, which screen, which skill>
```

Keep it concise. Only list files that were created or modified in this session or are critical for the next session.

### Step 3 — Log session

Append a row to `.agent/sessions.md`. If the file doesn't exist, create it with the header first:

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

---

## Reading Context (Session Start)

When starting a new session, if `.agent/handover.md` exists, read it to understand:
- What phase the project is in
- What was completed previously
- What's pending
- Key file locations

Do NOT read `history.md` or `sessions.md` unless the user asks about past sessions. They exist for traceability, not for routine context loading.

---

## Rules

1. **Always ask before writing.** Never update `.agent/` files without user confirmation.
2. **Handover must be concise.** No more than 40 lines. This is a quick-reference snapshot, not a detailed report.
3. **History is append-only.** Never modify or truncate `history.md`.
4. **Sessions is append-only.** Never modify or truncate `sessions.md`.
5. **No sensitive data.** Never write credentials, tokens, or secrets to `.agent/` files.
6. **Create if missing.** If any `.agent/` file doesn't exist, create it — don't error.