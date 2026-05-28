---
name: auto-fix-journey
description: Fixes backend Java errors in AEM Forms. Routes by user input — pasted Java stack trace or class:line → Fix mode; form URL → Telemetry mode; API path + 4xx/5xx → API Error mode; Splunk keyword / journey UUID / "drill deeper" → Splunk mode. Uses impact-analyser graph for repo routing and post-fix blast-radius analysis. Use when the user has a backend Java error, a failing API, or wants to explore Splunk logs.
compatibility: Requires git + gh CLI. Auto-installs impact-analyser CLI into ~/.impact-analyser/ on first run. Python 3 + splunk-sdk required only for Splunk mode.
allowed-tools: Read Write Edit Bash Agent AskUserQuestion
metadata:
  author: adobe-forms
  domain: forms-debugging
  user_invocable: "true"
---

# Auto Fix Journey

End-to-end pipeline for backend Java errors in AEM Forms: classify → user-approve a plan → patch → IA blast-radius → PR.

## Routing — first match wins

| User message | Mode | Where |
|---|---|---|
| Java stack frame / exception name / `ClassName:line` | **Fix mode** | this file |
| Form URL alone (no stack, no API) | **Telemetry mode** | `references/telemetry-mode.md` |
| API path + 4xx/5xx / error label | **API Error mode** | `references/api-error-mode.md` |
| UUID / "trace journey" / "show errors" / "drill deeper" / "FDM performance" | **Splunk mode** | `references/splunk-mode.md` |
| Anything else | Ask which one applies | — |

The other three modes all transition into Fix mode at **Step 2** once they have enough context (Splunk extracts class+exception, telemetry hands off via API Error mode, etc).

## Inputs (Fix mode)

| Name | Required | Source |
|---|---|---|
| `EXCEPTION_TYPE` | yes | extracted from user's stack trace / message |
| `EXCEPTION_MESSAGE` | yes | same |
| `SHORT_CLASS` | yes | last segment of the throwing class |
| `FULL_CLASS` | no | full qualified name if visible |
| `LINE_NUMBER` | no | approximate line from the stack frame |
| `STACK_TRACE_EXTRACT` | no | up to 500 chars of raw stack |

If `SHORT_CLASS` or `EXCEPTION_TYPE` is missing from the user's message, ask once before proceeding.

## Workspace

Skill-specific artefacts under `${HOME}/form-auto-fix/` (shared with `auto-fix-form`):

- `.env` — Splunk credentials (only needed for API Error / Splunk modes).
- `<repo-name>/` — auto-cloned Java repos.
- `runs/<class-slug>-<YYYY-MM-DD>/` — per-run output.

Shared CLIs and graph data — reusable outside this skill — at their canonical paths:

- `~/.impact-analyser/cli/index.js` + `~/.impact-analyser/impact-graph.sqlite` + `~/.impact-analyser/impact-analyser.config.yaml`

## Gotchas

- `eval $IA_CMD <subcmd>` — never bare `$IA_CMD`. See `shared/references/ia-glossary.md`.
- Java stack frames from libraries (`org.eclipse.jetty`, `org.json`, `org.apache`) — the real fix site is the **lowest custom frame above** the third-party throw. Re-triage with that class.
- Sub-agents return JSON only; orchestrator owns every `Edit`.
- Never change log levels in a fix patch (`info` stays `info`, etc).
- `LINE_NUMBER` is approximate; sub-agents must verify the construct exists at ±10 lines.

## Pre-conditions for state-changing tool calls

Full table in `shared/references/branch-and-commit.md`. Summary:

| Tool | Requires |
|---|---|
| `Edit` / `Write` | Plan approved AND `HEAD` is `fix/auto-fix-journey-*` AND patch came from sub-agent JSON |
| `git commit` | At least one patch applied AND `HEAD` is the fix branch |
| `git push` | Commit succeeded |
| `gh pr create` | Push succeeded |

---

# Fix Mode

## Step 1 — Resolve

```bash
eval "$(bash ../../shared/scripts/resolve-workspace.sh)"
eval "$(bash ../../shared/scripts/load-env.sh)"
eval "$(bash ../../shared/scripts/resolve-ia.sh)"
```

Now `IA_CMD`, `IA_GRAPH`, `IA_CONFIG`, `IA_UNAVAILABLE` are set. If `IA_UNAVAILABLE` is set, triage falls back to manual repo resolution (Step 3).

## Step 2 — Triage

Run the shared triage helper:

```bash
bash ../../shared/scripts/ia-triage.sh \
  --type "$EXCEPTION_TYPE" --message "$EXCEPTION_MESSAGE" \
  --file-url "${FULL_CLASS:-$SHORT_CLASS}.java" --line "$LINE_NUMBER" \
  --symbol "$SHORT_CLASS" \
  --out "$RUN_DIR/ia-triage.json"
```

Parse the JSON summary:

- `ia_repo` — graph node's owning repo. Drives Step 3.
- `ia_file` — relative file path within that repo. Skip the `find` in Step 4 when present.
- `ia_trail` — symbol chain for the PR body.

If `empty: true` and **every** frame in the stack is third-party: extract the lowest custom frame (first `com.<org>.*` class above the throw) and re-run triage with that class as `--symbol`. Persist as the new `SHORT_CLASS`.

If still empty → continue without IA context; Step 3 auto-clones via IA config.

## Step 3 — Resolve target repo

```bash
eval "$(bash ../../shared/scripts/resolve-repo.sh --name "$ia_repo" \
        --clone-url "<extracted-from-IA-config>")"
```

The clone URL extraction is a 5-line `node -e` block that reads `$IA_CONFIG` and matches `ia_repo` against the org blocks — inline in the skill body, not hidden.

If `REPO_SOURCE == "ask"`: ask the user for the local path / git URL.

`BASE_BRANCH` defaults to the repo's default branch:

```bash
BASE_BRANCH=$(git -C "$REPO_PATH" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null \
              | sed 's|refs/remotes/origin/||' \
              || git -C "$REPO_PATH" rev-parse --abbrev-ref HEAD)
```

## Step 4 — Locate the source file

If `ia_file` is set and resolves under `$REPO_PATH`: use it.

Otherwise:

```bash
find "$REPO_PATH" -name "${SHORT_CLASS}.java" -not -path "*/test/*"
```

- Zero matches → ask the user for the path.
- Multiple matches → ask which to use.
- One match → set `SOURCE_FILE`.

## Step 5 — Classify + confidence gate

Read `references/fix-classifier.md` and apply its decision flow:

| Fix type | Action |
|---|---|
| `structural` (deterministic null / cast / bounds) | Proceed to Step 6 |
| `logic` (depends on runtime values not visible in source) | Ask the user for the missing data points before planning |
| `framework` (OSGi / CRX / FDM config) | Display a recommendation block; no code edit |

If confidence is anything short of "high — fix is deterministic from source alone", ask specific data questions naming the exact field / config key / runtime value needed.

## Step 6 — Plan gate

**Hard gate.** No `Edit` until the user issues `approve` / `fix it` / `proceed`. Even when the fix looks like a one-line null-guard.

Render a numbered plan:

```
# Fix Plan

[1] <EXCEPTION_TYPE> — <SHORT_CLASS>:<LINE_NUMBER>
    root cause : <one line — what is null/wrong>
    approach   : <one line — minimal-diff fix>
    scope      : single-line | multi-line
    risk       : low | medium | high
    file       : <SOURCE_FILE relative to repo root>

Commands: approve | skip 1 | redo 1: <guidance> | cancel
```

State machine:

- `approve` / `fix it` / `proceed` → freeze plan; proceed to Step 7.
- `skip <N>` → drop entry; if plan empties, ask `add: <error>` or `cancel`.
- `redo <N>: <guidance>` → re-derive root cause + approach with that guidance.
- `cancel` → `"Run cancelled — no changes made."` and exit. No branch, no edit.

## Step 7 — Spawn fix sub-agent

Read `tools/sub-agent-prompt-java.md`. Substitute `__SHORT_CLASS__`, `__EXCEPTION_TYPE__`, `__EXCEPTION_MESSAGE__`, `__STACK_TRACE__`, `__JOURNEY_CONTEXT__` (IA trail or "not available"), `__FIX_TYPE__`, `__FILE_PATH__`, `__LINE_NUMBER__`.

Multiple errors, different files → parallel; same file → sequential.

Sub-agent returns JSON per `shared/references/sub-agent-contract.md`.

## Step 8 — Apply patches

For each non-`needs_review`, non-`need_more_info` result:

```
Read(<SOURCE_FILE>)               # fresh read
verify old_string appears EXACTLY ONCE
Edit(<SOURCE_FILE>, old_string, new_string)
```

If `need_more_info`: stop, relay `what_i_know` + `questions` to the user, wait for the answer, re-spawn this sub-agent with the original prompt + answers appended.

`framework` and `logic/needs_review` results: display the recommendation; no file edit.

## Step 9 — Branch, commit, push

Follow `shared/references/branch-and-commit.md`. Fix branch: `fix/auto-fix-journey-<short-class-slug>-<YYYY-MM-DD>`.

## Step 10 — Impact analysis on the committed diff

```bash
git -C "$REPO_PATH" diff HEAD~1 HEAD --name-only \
  | while IFS= read -r f; do echo "$REPO_PATH/$f"; done > "$RUN_DIR/ia-diff.txt"

eval $IA_CMD analyse $IA_CONFIG_FLAG \
  --diff "$RUN_DIR/ia-diff.txt" \
  $IA_GRAPH_FLAG $IA_CONCEPT_ONLY \
  --format json > "$RUN_DIR/ia-analysis.json"

node -e "
  const d = JSON.parse(require('fs').readFileSync('$RUN_DIR/ia-analysis.json','utf8'));
  require('fs').writeFileSync('$RUN_DIR/ia-analysis.md', d.markdown || '');
"
```

Capture `IA_MD = $(cat $RUN_DIR/ia-analysis.md)`. On failure, set `IA_MD` to a one-line callout and continue.

## Step 11 — Raise PR

`gh pr create` per `shared/references/branch-and-commit.md`. PR body sections:

1. **Error context** — exception, stack trace extract, source class:line, IA trail (or "IA unavailable").
2. **Errors fixed** — table: class, exception, fix type, explanation. Structural fixes only.
3. **Flagged for manual review** — logic-type entries with manual-test checklists.
4. **Framework recommendations** — config-type entries with CRX / FDM paths.
5. **Impact Analysis** — `IA_MD` embedded verbatim (or unavailability callout).
6. **Test plan** — focused on the journeys / forms identified in IA D3 output.

---

## Error handling

| Situation | Action |
|---|---|
| `SHORT_CLASS` or `EXCEPTION_TYPE` missing from user message | Ask once before proceeding |
| `ia triage` exits non-zero or empty for a custom-class frame | Continue without IA context; ask for git URL if repo cannot be located |
| `IA_UNAVAILABLE` set | Skip Step 2 IA triage; manually resolve repo via `resolve-repo.sh --name` |
| Source file not found by `find` | Ask for the path |
| Multiple `.java` matches | Ask which to use |
| `old_string` not unique twice | `needs_review`; carry into PR body |
| `git push` fails | Surface the command; PR section gets `branch not pushed` note |
| `gh` not installed | Print the compare URL |
| `ia analyse` fails in Step 10 | One-line callout in PR body; never blocks the PR |

For Splunk-specific failures (ConnectionRefused, splunklib missing) see `references/splunk-mode.md`.
