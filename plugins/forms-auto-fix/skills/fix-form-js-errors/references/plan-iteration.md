---
name: plan-iteration
description: Deterministic state machine, command grammar, and plan-data shape for Phase 3 of the fix-form-js-errors skill. Drives the user-facing plan iteration loop until approval.
type: reference
---

# Phase 3 — Plan Iteration State Machine

Phase 3 of `fix-form-js-errors` blocks all writes (no `Edit`, no branch creation, no commit) until the user explicitly authorises the transition to Phase 4. This file defines the loop precisely so two runs over identical input produce identical behaviour.

## Plan data shape

A `plan[]` is an ordered list of entries. Each entry:

```ts
{
  id: number,              // 1-based, stable across the run
  error: {                 // copied from allErrors[N] at plan-generation time
    type: string,
    message: string,
    file: string,
    fileUrl?: string,
    line?: number,
    col?: number,
    source: "telemetry" | "live" | "user-provided" | "telemetry-only",
    count?: number,
    pct_sessions_affected?: number,
    interpretation?: string
  },
  root_cause: string,      // from planning sub-agent
  approach: string,        // from planning sub-agent
  scope: "single-line" | "multi-line" | "page-level" | "repo-wide",
  affected_files: string[],
  risk: "low" | "medium" | "high",
  alternatives: string[],
  status: "pending" | "approved" | "skipped" | "needs_review",
  user_guidance?: string   // populated by `redo N: <guidance>`; passed to the next planning sub-agent
}
```

`id` is assigned in plan-generation order and never reused, even after `skip`. New entries from `add:` get `id = max(plan.id) + 1`. This keeps user commands like `redo 3` unambiguous across the iteration.

## States

| State | Description | Transitions |
|-------|-------------|-------------|
| `INIT` | Plan-generation sub-agents have just returned. Build initial `plan[]`. All entries `pending` (or `needs_review` if the sub-agent flagged them). | → `PRESENTING` |
| `PRESENTING` | Render plan table to the user (see SKILL.md §3.2). | → `AWAITING_INPUT` |
| `AWAITING_INPUT` | Wait for one user line. | parse command → `MUTATING` / `APPROVED` / `CANCELLED` / `INVALID` |
| `MUTATING` | Apply the parsed command to `plan[]` (rules below). May spawn one or more planning sub-agents. | → `PRESENTING` |
| `INVALID` | User input did not match grammar. Print grammar; do not mutate. | → `AWAITING_INPUT` |
| `APPROVED` | Terminal — emit `plan[]` to Phase 4. | exit |
| `CANCELLED` | Terminal — emit nothing. SKILL.md error-handling table covers messaging. | exit |

## Command grammar

Match the user's input against this grammar **in order** (first match wins). Matching is case-insensitive on the verb. Whitespace around separators is allowed.

| Command | Regex | Effect |
|---------|-------|--------|
| `approve` | `^(approve\|fix it\|proceed)\s*$` | Set state `APPROVED`. Every `pending` entry → `approved`. `skipped` and `needs_review` stay as-is and surface in PR body. Plan empty (no `pending`/`needs_review`) → reject; print "Plan is empty — add an error or cancel." → `AWAITING_INPUT` |
| `cancel` | `^cancel\s*$` | Set state `CANCELLED`. |
| `skip` | `^skip\s+([\d,\s]+)$` | For each id: set `status = "skipped"`. Unknown ids → `INVALID`. |
| `unskip` | `^unskip\s+([\d,\s]+)$` | For each id: if `status == "skipped"`, set `pending`. Otherwise no-op (silent). |
| `redo` | `^redo\s+(\d+)(?:\s*:\s*(.+))?$` | Re-spawn ONE planning sub-agent for entry `N`. If `: <guidance>` present, store it in `user_guidance` and append to the sub-agent prompt. Replace `root_cause`, `approach`, `scope`, `affected_files`, `risk`, `alternatives` from the new result. Keep `id`, `error`, `status` (reset to `pending` if it was `needs_review`). |
| `regenerate` | `^regenerate\s*$` | Re-spawn ALL planning sub-agents on the original `allErrors[]`. Replace `plan[]` from scratch (ids restart at 1). User-added errors persist through this; their entries are also regenerated. |
| `add` | `^add\s*:\s*(.+)$` | Parse the `<.+>` payload as one error string (use Phase 2C's parser). Append to `allErrors[]`, spawn one planning sub-agent, append the new entry to `plan[]` with `id = max(plan.id)+1`. |
| `merge` | `^merge\s+(\d+)\s*,\s*(\d+)$` | (Optional, advanced) Combine entries A and B if `affected_files` overlaps. Replace with one entry, spawn a planning sub-agent for the combined error context. The new entry gets `id = max(plan.id)+1`; the originals get `status = "skipped"` (kept for traceability). |
| `show` | `^show\s+(\d+)$` | Print the full entry (all fields including `alternatives`, `affected_files`). No mutation. → `AWAITING_INPUT` |
| `help` / `?` | `^(help\|\?)\s*$` | Print the command grammar. No mutation. |

Anything else → `INVALID`.

## Mutation rules

1. **Mutations are atomic per command.** If a sub-agent spawn fails (e.g. `redo 1` errors), leave the entry untouched and surface the error; do not partially update.
2. **Re-render after every successful command.** The user always sees a fresh plan table.
3. **`needs_review` is informational, not blocking.** A user can `approve` a plan that contains `needs_review` entries — they flow into the PR's "Manual review needed" section. They do not become fix tasks.
4. **`skipped` entries are not regenerated** by `regenerate` — they stay skipped to preserve the user's intent.
5. **Sub-agent calls**: parallelism rules from SKILL.md §3.1 apply (different files in parallel, same file sequential). For `regenerate`, group by `affected_files[0]` and respect that.

## Approval semantics

When the user issues `approve`:

- **Pending entries → fix tasks for Phase 4.2.** Pass each entry's `{ error, root_cause, approach, affected_files, user_guidance }` to the fix sub-agent prompt.
- **`needs_review` entries → PR "Manual review needed".** Carried into Phase 6.3 PR body.
- **`skipped` entries → PR "Errors not fixed"** (Phase 7 run report's "Errors not fixed" section).

The plan is frozen; further user input cannot alter it. The orchestrator never asks for confirmation again — Critical Rule #4.

## Empty-plan guard

If at the moment of `approve` every entry is `skipped` (no `pending`, no `needs_review`):

```
Plan is empty — every entry is skipped. Type:
  add: <error description>   to add a new error
  unskip <N>                 to bring entry N back
  cancel                     to abort the run
```

Do not proceed to Phase 4 with an empty fix list.

## Examples

```
> show 1
[1] TypeError — fdPanel.forEach is not a function
    file           : blocks/fd-card/fddetailsutil.js:59
    source         : telemetry+live  count=1240  affected=12.3%
    root cause     : fdPanel is the model field, returning a single object when count==1.
                     forEach is being called unconditionally.
    approach       : Wrap the iteration site with Array.isArray; coerce to [fdPanel] when single.
    scope          : single-line   risk : low
    affected files : blocks/fd-card/fddetailsutil.js
    alternatives   : (1) Array.from(fdPanel) — works for objects with .length
                     (2) refactor caller to always pass array — wider blast radius

> redo 1: prefer Array.from over Array.isArray check — it's our convention here
(re-spawning planning sub-agent for entry 1 with extra guidance…)

# Fix Plan — 2 entries

[1] TypeError — fdPanel.forEach is not a function
    approach   : Replace fdPanel.forEach(…) with Array.from(fdPanel).forEach(…) — the
                 codebase uses Array.from() elsewhere for the same coercion.
    scope      : single-line   risk : low
    …

> skip 2

# Fix Plan — 2 entries  (1 skipped)

[1] TypeError — fdPanel.forEach is not a function           [pending]
[2] ReferenceError — _satellite is not defined              [skipped]

> approve
✓ Plan approved. Proceeding to Phase 4 (fix application).
```

## Determinism guarantees

- Same `allErrors[]` + same user command transcript → same final `plan[]` (sub-agent stochasticity aside).
- No hidden state. The full plan is rendered after every command; the user can always reconstruct what will run.
- The grammar is closed: any input not matching the table goes to `INVALID` with a printed grammar reminder. There is no fuzzy matching of intent — if the user types something unexpected, ask, do not guess.
