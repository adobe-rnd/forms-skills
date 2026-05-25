---
name: auto-fix-form
description: End-to-end workflow for fixing AEM/EDS form JS errors. Invoke with a form URL (telemetry-driven run) or a pasted JS stack frame (skip telemetry). Generates a user-gated fix plan, applies patches via sub-agents, runs performance-bot, and raises a PR. Use when the user provides a form URL or pastes a JS stack trace, TypeError, or ReferenceError.
compatibility: Requires git + gh CLI. Auto-installs performance-bot to ~/.performance-bot/ and impact-analyser to ~/.impact-analyser/ on first run; degrades gracefully if either is unavailable.
allowed-tools: Read Write Edit Bash Glob Grep Agent Skill WebFetch AskUserQuestion
metadata:
  author: adobe-forms
  domain: forms-debugging
  user_invocable: "true"
---

# Auto Fix Form

End-to-end pipeline: discover JS errors on a form → user approves a per-error fix plan → patches applied → perf-bot gate → impact analysis → PR per affected repo.

## When to use

| User input | Behaviour |
|---|---|
| Form URL (production host) | Telemetry-driven run via `optel-query` |
| Pasted JS stack frame / `TypeError` / `ReferenceError` | Skip telemetry; build a single `allErrors[]` entry from the frame |
| Form URL + stack frame both present | Stack frame wins (deterministic single-entry path) |
| Non-production URL (`aem.page`, `hlx.page`, `localhost`) | Tell the user telemetry isn't available; ask for a production URL or pasted error |

## Inputs

| Name | Required | Default |
|---|---|---|
| `FORM_URL` | yes (unless stack frame pasted) | — |
| `REPO_PATH` | no | `resolve-repo.sh` (cwd → `${HOME}/form-auto-fix/<name>`) |
| `BASE_BRANCH` | no | repo default branch |
| `DATE_RANGE` | no | `<TODAY>:<TODAY>` |

## Workspace

Skill-specific artefacts live under `${HOME}/form-auto-fix/`:

- `.env` — user-managed env vars (none required for this skill; loaded for compatibility).
- `<repo-name>/` — auto-cloned target repos (shared with `auto-fix-journey`).
- `runs/<form-slug>-<YYYY-MM-DD>/` — per-run output, sub-agent prompts, perf-bot reports, IA reports.

Shared CLIs and graph data live at their canonical locations and are reusable outside this skill:

- `~/.impact-analyser/cli/index.js` + `~/.impact-analyser/impact-graph.sqlite` + `~/.impact-analyser/impact-analyser.config.yaml`
- `~/.performance-bot/index.js`

## Gotchas

- `eval $IA_CMD <subcmd>` — bare `$IA_CMD` fails when the value contains a space (Node 20 binary + script path). See `shared/references/ia-glossary.md`.
- AEM minified URLs (`.min.ACSHASH<hash>.js`) are never in the graph; `ia-triage.sh` rewrites to the source clientlib path.
- `ia triage --symbol <bareJsName>` always returns unresolved; `ia-triage.sh` does a SQLite JsFunction lookup first.
- After plan approval, every entry applies without re-prompting — that's the contract.
- Sub-agents return JSON only; the orchestrator owns every `Edit`.
- `.perf-bot-report.md` is auto-added to the target repo's `.gitignore`.
- Branch-name collision → append `-v2`, `-v3` (handled by `shared/references/branch-and-commit.md`).
- Run output goes under `${FORM_AUTO_FIX_RUNS}/`, never inside the user's repo.

## Pre-conditions for state-changing tool calls

See `shared/references/branch-and-commit.md` for the full table. Summary:

| Tool | Requires |
|---|---|
| `Edit` / `Write` | Plan approved AND `HEAD` is `fix/auto-fix-*` AND patch came from sub-agent JSON |
| `git commit` | Perf-bot has run AND `HEAD` is the fix branch |
| `git push` | Commit succeeded |
| `gh pr create` | Push succeeded |

---

## Phase 1 — Resolve

```bash
eval "$(bash shared/scripts/resolve-workspace.sh)"
eval "$(bash shared/scripts/load-env.sh)"
eval "$(bash shared/scripts/resolve-repo.sh)"
eval "$(bash shared/scripts/resolve-ia.sh)"
```

After this block `FORM_AUTO_FIX_ROOT`, `FORM_AUTO_FIX_RUNS`, `REPO_PATH`, `REPO_NAME`, `IA_CMD`, `IA_GRAPH`, `IA_CONFIG`, `IA_UNAVAILABLE` are all set.

If `REPO_SOURCE == "ask"`: ask the user for the local clone path before continuing.

Create the run directory:

```bash
RUN_DIR="${FORM_AUTO_FIX_RUNS}/<form-slug>-<TODAY>"
mkdir -p "$RUN_DIR"
```

`<form-slug>` is the last non-empty path segment of `FORM_URL`, slugified. Fallback: `$REPO_NAME`.

## Phase 2 — Error discovery

### 2.0 Stack frame fast path

If the user's message contains a JS stack frame (`<symbol>@<url>:<line>:<col>`) or a JS exception (`TypeError:` / `ReferenceError:` / `RangeError:` / `EvalError:` / `URIError:`):

- Extract `EXCEPTION_TYPE`, `EXCEPTION_MESSAGE`, `STACK_FRAME_URL`, `STACK_LINE`, `STACK_COL`.
- Build a single `allErrors[]` entry with `source: "invocation"` and `count: null`.
- Skip 2.A; go straight to 2.B (IA triage).

### 2.A Telemetry (when no stack frame)

```
Skill("optel-query", "Get all JavaScript errors for <FORM_URL> on <DATE_RANGE>.
Return: { message, file, line, count, pct_sessions_affected }. Sort by count desc.")
```

Apply classification + dedup per `references/fix-classification.md`. Render a numbered table; ask the user which to fix (number list or `all`). Empty result → `"Form appears healthy — no JS errors detected."` and exit with a Phase 7 report.

### 2.B IA triage

For each selected error:

```bash
bash shared/scripts/ia-triage.sh \
  --type "<type>" --message "<message>" \
  --file-url "<fileUrl>" --line "<line>" --col "<col>" \
  --symbol "<extracted-from-stack-frame>" \
  --out "$RUN_DIR/ia-triage-<id>.json"
```

The triage summary JSON gives `ia_repo`, `ia_file`, `ia_trail`. Attach to the entry as `iaContext`.

If `ia_repo` differs from `$REPO_NAME`, that error targets a foreign repo. Resolve once:

```bash
eval "$(bash shared/scripts/resolve-repo.sh --name "$ia_repo" --clone-url "<from IA config>")"
```

Set `entry.targetRepoPatch = { repoPath, repoName }` or leave null if resolution failed.

Display the finalised table (error, file:line, count, target repo, IA summary) and proceed to Phase 3.

See `references/fix-classification.md` for the page-level / repo-search special cases (when `file` is a page URL or no URL is present).

## Phase 3 — Plan generation & user iteration

**Hard gate.** No `Edit`, `Write`, branch, or commit may happen until the user types `approve` / `fix it` / `proceed`. The state machine, command grammar, and exit conditions live in `references/plan-iteration.md`.

### 3.1 Spawn planning sub-agents

Per error, spawn one sub-agent using `assets/plan-sub-agent-prompt.md`. Seed with `entry.iaContext` and `entry.targetRepoPatch.repoPath` (or `$REPO_PATH`). Return shape: `shared/references/sub-agent-contract.md`.

Parallelism: different files → parallel; same file → sequential (re-read between).

`need_more_info` results block `approve` until the user answers or skips them.

### 3.2 Present and iterate

Render the numbered plan (file, root cause, approach, scope, risk per entry). Loop on user commands per `references/plan-iteration.md` until `approve`. On `cancel` → `"Run cancelled — no changes made."` and exit; no branch, no edit.

### 3.3 Approval freezes the plan

Every `pending` entry → fix task. `needs_review` → PR's "Manual review needed" section. `skipped` → run report's "Errors not fixed".

## Phase 4 — Apply approved fixes

### 4.1 Branch per target repo

Group plan entries by their target repo (`entry.targetRepoPatch.repoPath ?? $REPO_PATH`). For each unique target, follow `shared/references/branch-and-commit.md` to checkout a fresh `fix/auto-fix-<slug>-<TODAY>` branch off `BASE_BRANCH`.

### 4.2 Spawn fix sub-agents

For each approved entry: one sub-agent using `assets/fix-sub-agent-prompt.md`, seeded with the plan's `root_cause` and `approach`. Same parallelism rules as 3.1.

For page-level and repo-search entries, run the grep recipe from `references/fix-classification.md` first and pass results to the sub-agent.

JSON shape: `shared/references/sub-agent-contract.md`.

### 4.3 Apply patches (no commit)

For each non-`needs_review` result:

```
Read(<target>/<file_relative>)              # fresh read
verify old_string appears EXACTLY ONCE
Edit(<target>/<file_relative>, old_string, new_string)
errorFixedFiles[<target>] += <file_relative>
```

If `old_string` is not unique: re-spawn the sub-agent with wider context once. Working trees stay dirty until Phase 6.

## Phase 5 — Performance-bot gate

```bash
bash shared/scripts/perf-bot.sh --mode run --repo "$REPO_PATH"
```

Parse the resulting `.perf-bot-report.md` per `references/perf-bot-violations.md`. For each violation, spawn one sub-agent using `assets/perf-bot-fix-prompt.md`. Loop until 0 violations or 3 iterations — remaining go to PR's "Performance follow-ups".

Capture each iteration's report into `$RUN_DIR/perf-bot-report-iter<N>.md`.

If the CLI install or Node check fails, surface in the PR body and proceed to Phase 6 — the error-fix commit still happens.

## Phase 5.5 — Impact analysis & cross-repo

Best-effort. When `IA_UNAVAILABLE` is empty and at least one patch was applied, follow `references/cross-repo-propagation.md`. Otherwise skip to Phase 6 with a one-line note in the PR.

## Phase 6 — Commit, push, PR

For each target repo with applied fixes, follow `shared/references/branch-and-commit.md`:

1. Stage only orchestrator-tracked files.
2. One commit per repo with the structured message.
3. Push, then `gh pr create` (fall back to compare URL if `gh` is unavailable).

PR body sections (in order):

1. Plan summary (Phase 3 — file, error, approach, status).
2. Errors fixed (Phase 4 — file, line, error, explanation).
3. Performance-bot violations fixed (Phase 5).
4. Performance follow-ups (Phase 5 leftovers).
5. Impact Analysis — full `IA_MD` from Phase 5.5 (or a one-line callout if unavailable).
6. Cross-Repo PRs table (Phase 5.6).
7. Manual review needed — `needs_review` entries from Phase 4 + plan-iteration `needs_review` + cross-repo equivalents.
8. Form context — `FORM_URL`, date range, error counts from 2.A.
9. Test plan checklist.

## Phase 7 — Run report

Write `$RUN_DIR/auto-fix-report.md` with one section per phase: resolved paths, telemetry table, IA triage JSON per error, every Phase 3 command + plan diff, fix sub-agent prompts + JSON, per-iteration perf-bot reports, Phase 5.5 / 5.6 artefacts, Phase 6 commit SHAs + PR URLs.

Print: `📄 Run report saved: $RUN_DIR/auto-fix-report.md`

---

## Error handling (residual cases not covered by pre-conditions)

| Situation | Action |
|---|---|
| `FORM_URL` missing AND no stack frame in message | Ask once before proceeding |
| `optel-query` returns no data | Ask whether to enter errors manually or abort |
| `REPO_SOURCE == "ask"` | Ask the user for the local clone path |
| `ia triage` returns empty for a custom-class frame | Continue with source-only analysis; `iaContext = null` |
| Source file 404 / minified with no map | Flag `needs_review`; suggest source maps |
| Phase 3 — plan empty after skips | Ask `add: <error>` or `cancel`; never auto-approve empty |
| `old_string` not unique twice | `needs_review`; carry into PR body |
| Phase 5 CLI install / Node < 20 | Surface in PR; commit error fixes anyway |
| `.perf-bot-report.md` missing or malformed | `needs_review` entry; break perf-bot loop; proceed to Phase 6 |
| Both `errorFixedFiles[]` and `perfFixedFiles[]` empty | Skip commit; PR step decides whether to open empty PR |
| Run interrupted between 4.3 and 6.1 | On retry, ask whether to discard or stash — never auto-discard |
| `git push` fails | Show the command; continue to PR step with `needs_review: "branch not pushed"` |
| `IA_UNAVAILABLE` set | Skip Phase 5.5/5.6 entirely; one-line PR callout |
