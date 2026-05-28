---
name: sub-agent-contract
description: Canonical JSON shapes every sub-agent in the forms-auto-optimisation plugin returns. Read once; referenced from every sub-agent prompt.
type: reference
---

# Sub-Agent JSON Contract

Every sub-agent spawned by `auto-fix-form` or `auto-fix-journey` returns **exactly one** JSON object on stdout — no prose, no markdown fences. The orchestrator owns every `Edit` / `Write` / `git` / shell call; sub-agents are read-only analysers.

## Three shapes (pick one)

### 1. Patch — sub-agent produced a fix it is confident in

```json
{
  "file_relative": "blocks/fd-card/fddetailsutil.js",
  "old_string": "<exact substring of current file content>",
  "new_string": "<replacement>",
  "explanation": "one sentence — what changed and why it matches the approved approach"
}
```

Rules:
- `file_relative` is **relative to the target repo root**, never absolute.
- `old_string` must appear **exactly once** in the file. If not, expand context (1–2 lines above + below) until it is unique.
- Do not add imports, comments, or formatting changes outside the patched lines.
- Do not touch files under `/node_modules/`, `/dist/`, `/target/`, or any vendored path — return `needs_review` instead.

### 2. Needs review — fix is beyond automated planning

```json
{
  "needs_review": true,
  "file_relative": "<most relevant file found, or 'unknown'>",
  "analysis": "what you found, why a patch was not produced, what a reviewer should check"
}
```

Use when:
- File is minified, generated, or vendored.
- Approved approach no longer matches file state (e.g. another patch in this run already fixed it).
- Multiple files need changes — list them in `analysis` and let the orchestrator re-spawn.

### 3. Needs more info — runtime data missing

```json
{
  "need_more_info": true,
  "questions": [
    "<specific question 1 — name the exact field, config key, or runtime value needed>",
    "<specific question 2>"
  ],
  "what_i_know": "one paragraph: what the code does, what the throw site is, why the root cause is ambiguous without the missing data"
}
```

Use only when the correct fix genuinely depends on runtime data not visible in the source (an OSGi config value, an API response field, a DB row). Do **not** use as a default hedge — a null-guard you can see in source is always plannable.

When this comes back, the orchestrator surfaces `questions` + `what_i_know` to the user, then re-spawns the same sub-agent with the user's answers appended.

## Constraints the orchestrator enforces

| Rule | Why |
|---|---|
| Sub-agent uses **only** Read / Grep / Glob | Keeps the run atomic and re-entrant; sub-agent crashes don't leave half-applied state |
| Sub-agent returns **one** JSON object, nothing else | The orchestrator parses with `JSON.parse` — prose breaks it |
| Orchestrator re-reads the file before `Edit` | Sub-agent's `old_string` may have drifted if another sub-agent edited the same file earlier in the run |
| Orchestrator verifies `old_string` uniqueness before `Edit` | If not unique, re-spawn with wider context once; second failure → `needs_review` |
