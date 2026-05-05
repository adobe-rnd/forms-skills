---
name: auto-fix-form
description: End-to-end workflow for diagnosing and fixing AEM/EDS form errors. Queries telemetry via /optel-query, diagnoses live forms via live-debug-form, generates a per-error fix plan that the user iterates on until approved, applies patches through parallel sub-agents, gates the working tree through performance-bot --diff HEAD, then commits and raises a PR against the user-supplied base branch. Use when the user asks to debug, investigate, or fix errors on an AEM Adaptive Form or EDS form — by URL or by error string.
compatibility: Requires Chrome DevTools MCP for Mode A. Works with EDS/forms-engine (window.myForm) and AEM Core Components (guideBridge). Requires git + gh CLI for PR creation. Phase 5 requires Node 20+ and the performance-bot CLI at ~/.performance-bot/index.js — installed inline on first run if missing.
allowed-tools: Read Write Edit Bash Glob Grep Agent Skill WebFetch AskUserQuestion mcp__chrome-devtools__evaluate_script mcp__chrome-devtools__navigate_page mcp__chrome-devtools__new_page mcp__chrome-devtools__list_pages mcp__chrome-devtools__select_page mcp__chrome-devtools__take_snapshot mcp__chrome-devtools__list_console_messages mcp__chrome-devtools__list_network_requests mcp__chrome-devtools__get_network_request
metadata:
  author: adobe-forms
  domain: forms-debugging
  user_invocable: "true"
---

# Auto Fix Form

Deterministic, plan-gated workflow. The user drives Phase 3 (plan iteration) and authorises the transition to fix-application; everything else is mechanical.

---

## 🛑 NON-NEGOTIABLE EXECUTION CONTRACT — read before any tool call

This skill HAS FAILED in production when the orchestrator skipped Phase 3 and edited files directly on the user's branch. To prevent that, every state-changing tool call has a **hard pre-condition**. Verify the pre-condition before EVERY such call. If a pre-condition is false, STOP and complete the missing phase first — there is no fast-path.

| Tool call | Pre-condition (ALL must be true) |
|-----------|-----------------------------------|
| `Edit` / `Write` (any source file) | (a) Phase 3 plan is **approved** (user typed `approve` / `fix it` / `proceed`). (b) Phase 4.1 created `fix/auto-fix-*` and `git rev-parse --abbrev-ref HEAD` returns it (NOT `main`, NOT `BASE_BRANCH`). (c) The patch came from a sub-agent's JSON, not from your own file reading. |
| `git checkout -b <fix-branch>` | Phase 3 plan is approved. |
| `git commit` | (a) Phase 5 has run (passed OR hit iteration cap OR CLI unavailable flag set). (b) `git rev-parse --abbrev-ref HEAD` is the fix branch. |
| `git push` | `git commit` succeeded. |
| `gh pr create` | `git push` succeeded (or fallback compare URL is being printed). |

### Phase ordering — strict

```
1 → 2 (any of 2A/2B/2C, then 2.M) → 3 → [user: approve] → 4 → 5 → 6 → 7
                                          ▲
                                          └── ONLY user input crosses this gate
```

You may **not** skip Phase 3 because:
- Telemetry "made the fix obvious" — still go through Phase 3.
- Live diagnosis (Phase 2B) ended via timeout, user keyword, or Chrome DevTools MCP failure — proceed with the errors you have, still go through Phase 3. Reaching a step that needs user-supplied data is normal Phase 2B behavior — wait for the user, do NOT classify the step as "blocked" or "unreachable".
- There is only one error, or the fix is "trivial" / "a one-liner" — Phase 3 is still mandatory; the user can `approve` immediately.

The orchestrator **must not** read source files for analysis. File reading for analysis is the planning sub-agent's job (Phase 3.1) and the fix sub-agent's job (Phase 4.2). The orchestrator only `Read`s files to verify `old_string` uniqueness immediately before `Edit` (Phase 4.3) — never for "let me understand the bug." If you find yourself running `sed`/`Bash`-`cat`/`Read` on a JS file before Phase 4, you are violating the contract.

When you reach the end of Phase 2.M, the **next thing you do** is print the plan summary table from Phase 3.2 and wait for a user command. Do not edit. Do not branch. Do not commit. Do not Bash-read the source code. Wait.

---

## CRITICAL RULES

| # | Rule | Wrong | Right |
|---|------|-------|-------|
| 1 | **Plan must be approved before any Edit / branch / commit** | Read source, identify fix, Edit immediately | After Phase 2.M, present plan, wait for user. ONLY `approve` / `fix it` / `proceed` unblocks Phase 4 |
| 2 | **Never edit on the user's branch** | `Edit` while `HEAD == main` (or BASE_BRANCH) | First `git checkout -b fix/auto-fix-<slug>-<TODAY>` (Phase 4.1), then Edit |
| 3 | **Never commit to the user's branch** | `git commit` on `uat-cards-release-test` | Commit lives on the fix branch only |
| 4 | **PR base is always the user's branch** | `--base main` | `--base <BASE_BRANCH>` |
| 5 | **After approval, never re-confirm individual patches** | "Apply patch 1? y/n" | Apply every approved entry without prompts |
| 6 | **Resolve REPO_PATH before asking** | Always ask | If `pwd` is inside a git repo, use `git rev-parse --show-toplevel`; only ask if not |
| 7 | **Never commit before performance-bot has run** | Commit after Phase 4, then run perf-bot | Apply fixes to working tree, run `--diff HEAD`, fix violations, **then** commit (Phase 6.1) |
| 8 | **Never skip Phase 5 because CLI is missing** | "perf-bot not installed — skipping" | Install inline (`mkdir -p ~/.performance-bot && curl … \| tar -xz -C ~/.performance-bot`); only after install fails, set `PERF_BOT_INSTALL_FAILED` and surface in PR |
| 9 | **Never loop the perf-bot gate forever** | Retry until clean | Cap at 3 iterations; remaining violations → "Performance follow-ups" in PR |
| 10 | **Sub-agents return JSON only — orchestrator owns Edit** | Sub-agent calls Edit | Sub-agent returns `{file_relative, old_string, new_string, …}`; orchestrator validates uniqueness then applies |
| 11 | **Orchestrator does not analyse source files** | Bash `sed`/`cat`/`grep` on a `.js` file before Phase 4 | All analysis is delegated to planning sub-agents (Phase 3.1) and fix sub-agents (Phase 4.2) |
| 12 | **Cancel cleanly** | Half-applied patches on disk after `cancel` | Phase 3 cancel → discard plan, no Edit, no branch. Phase 4+ cancel → branch exists, document in report |
| 13 | **Phase 2B exits only on timeout, user keyword, or MCP failure** | Decide a panel is "blocked" / "stuck" / "needs data we don't have" and skip the step-walk loop | Print STATE 1, then poll. Every panel of a multi-step form needs user-supplied input — that is what the loop waits for. The user advances the form in the browser; your DOM observer detects the transition |

---

## Role split

`auto-fix-form` is the orchestrator. It delegates: telemetry to `/optel-query` (2A), browser/diagnostics to `live-debug-form` (2B — never invoked directly), planning to plan sub-agents (3.1), patching to fix sub-agents (4.2), perf-bot lint to the local CLI + per-violation sub-agents (5), and git/gh for branch, commit, push, PR (4.1, 6.1–6.3). The orchestrator owns all `Edit` calls; sub-agents return JSON only.

---

## Two invocation modes

**Mode A — URL** (`1 → 2A → 2B → 3 → 4 → 5 → 6 → 7`):

| Parameter | Required | Description |
|-----------|----------|-------------|
| `FORM_URL` | Yes | Live URL of the form page |
| `ERROR` | No | Pre-filter to a specific error (file + line or message substring) |
| `REPO_PATH` | No | Local repo path — auto-resolved or asked in Phase 4.1 |
| `BASE_BRANCH` | No | Base branch — asked in Phase 4.1 if omitted |

**Mode B — Error strings** (`1 → 2C → 3 → 4 → 5 → 6 → 7`). No browser:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `ERRORS` | Yes | One or more error strings (any format) |
| `REPO_PATH` | No | Auto-resolved if `pwd` is in a git repo; otherwise asked |
| `BASE_BRANCH` | No | Asked if omitted |

**Accepted error formats:**
```
fdSelectHandler@https://host/path/file.js:59:11 | typeerror: fdPanel.forEach is not a function
TypeError: Cannot read properties of null (reading 'type')  at fd-dom-functions.js:227
"_satellite is not defined" in analytics.js line 79
```

**Mode detection:** URL only → Mode A. Error strings, no URL → Mode B. URL + error strings → Mode A with `allErrors[]` pre-populated, skip 2A.

---

## Phase 1 — Input Resolution

1. **Detect mode** from user input per the table above.
2. **Mode A only:** call `mcp__chrome-devtools__list_pages` once. If it errors, ask the user to restart Claude Code.
3. **Resolve `REPO_PATH` if `pwd` is inside a git repo** (used in Mode B and Phase 4.1):

   ```bash
   if git -C "$PWD" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
     REPO_PATH=$(git -C "$PWD" rev-parse --show-toplevel)
     REPO_REMOTE=$(git -C "$REPO_PATH" remote get-url origin 2>/dev/null || echo "no remote")
     echo "Resolved REPO_PATH: $REPO_PATH (origin: $REPO_REMOTE)"
   fi
   # Otherwise ask in Phase 4.1.
   ```

   `BASE_BRANCH` is asked at the top of Phase 4.1 unless provided at invocation.

Print resolved values once. Do not block on confirmation.

---

## Phase 2 — Error Discovery

The output of this phase is a single deduplicated, classified `allErrors[]`. Each entry: `{ type, message, file, fileUrl, line, col, source, count?, pct_sessions_affected?, interpretation? }`.

### 2A — Telemetry query (Mode A, production URL only)

Run only when `FORM_URL`'s host is **not** `aem.page` / `aem.live` / `hlx.page` / `hlx.live` / `localhost`.

Use `<TODAY>` from environment context (`YYYY-MM-DD`) as both `startDate` and `endDate` unless the user specifies a range. Never `Bash(date)`.

```
Skill("optel-query", "Get all JavaScript errors for <FORM_URL> on <TODAY>.
Return: { message, file, line, count, pct_sessions_affected }. Sort by count desc.")
```

Read `references/fix-classification.md` for the classification + dedup rules. Show a table of fixable errors (type, message, file:line, count, fix type) plus a list of skipped entries with reasons. Ask: **"Which error(s) to investigate? Number, comma-separated list, or 'all':"** Filter to `selectedErrors[]`.

If `ERROR` was passed at invocation, skip this prompt and pre-filter. `/optel-query` failure is handled in the Error Handling table.

### 2B — Live diagnosis (Mode A only)

A multi-step form requires the user to enter data and click "next" at each panel. Phase 2B's job during the wait is to **wait** — the user advances the form, the DOM observer detects the transition, the loop continues. **The agent does NOT classify any panel as "blocked", "stuck", "unreachable", or "needs data we don't have".** Only three things end Phase 2B: (a) the step-walk loop hits its 5-min idle timeout (STATE 4b), (b) the user types a polling-loop exit keyword (`proceed` / `stop` / `skip` / `next phase`), or (c) Chrome DevTools MCP loses connection.

Read `references/step-walk.md` before any browser call.

If `mcp__chrome-devtools__list_pages` errors at any point: stop Phase 2B immediately. Do NOT use Bash, curl, WebSocket, or any CDP fallback. Tell the user: "Chrome DevTools MCP can't connect — please close any open Chrome windows and restart this run, or type `skip-live` to continue with telemetry errors only." Wait for user response.

Run, in order:
1. `Skill("live-debug-form")` for **Steps 1 + 2 only** (navigate + resolve). Never call its tool files directly.
2. The step-walk loop from `references/step-walk.md`. Setup is initialization. The loop body is STATE 1 → STATE 2 → STATE 3 (poll) → STATE 4a (collect via Diagnostic F, then loop back to STATE 1) until STATE 4b fires. Do not proceed to 2.M until then.

live-debug-form returns:
```
diagnosticResults = {
  formInfo: { formId, title, fieldCount, source },
  errors: [{ step, type, message, file, fileUrl, line, col, interpretation }],
  networkFailures: [{ url, status, step }],
  formModelErrors: [{ fieldName, error }]
}
```

### 2C — Error parsing (Mode B only)

For each error string, extract `type`, `message`, `fileUrl`, `file`, `line`, `col`. Set `source: "user-provided"`. Apply the `references/fix-classification.md` table.

### 2.M — Merge

Combine `selectedErrors[]` (2A) with `diagnosticResults.errors[]` (2B) and Mode B parsed errors:

- Deduplicate by `(file, line)` — prefer live entry (it has `interpretation`).
- Enrich live entries with `count` + `pct_sessions_affected` from telemetry matches.
- Telemetry-only entries: keep with `source: "telemetry-only"`, no interpretation.

If `ERROR` was given at invocation, filter `allErrors[]` to the matching entry. Display a summary table (form title, field count, steps reached/total, each error: type, file:line, message, count, source). If `allErrors[]` is empty, print `"Form appears healthy — no JS errors detected."` and exit with a brief Phase 7 report. Otherwise proceed to Phase 3.

---

## Phase 3 — Plan Generation & Iteration

> 🛑 **HARD GATE.** No `Edit`, `Write`, `git checkout -b`, or `git commit` is allowed until the user issues `approve` / `fix it` / `proceed` in 3.3. This applies even when there is only one error, even when telemetry "made the fix obvious", and even when Phase 2B ended early (timeout, user-skip, or MCP failure) — proceed with whatever errors you have, but still go through this phase.

> The orchestrator does NOT read source files for analysis here. The planning sub-agents (3.1) own all source-reading. If you find yourself running `Bash sed`/`cat`/`grep` or `Read` on a `.js` / `.css` / `.html` file before Phase 4, you are bypassing the gate.

### 3.1 Generate plan entries

For each entry in `allErrors[]`, spawn a planning sub-agent using `assets/plan-sub-agent-prompt.md`. Parallelism rules:

- **Different files** → spawn ALL sub-agents in parallel (single message, multiple `Agent` tool uses).
- **Same file** → sequential. Re-read the file between sub-agents so each has fresh context.

Each sub-agent returns JSON only:
```json
{
  "error_id": 1,
  "root_cause": "one paragraph — what is happening at runtime",
  "approach": "one paragraph — proposed fix at a high level (NO patch yet)",
  "scope": "single-line | multi-line | page-level | repo-wide",
  "affected_files": ["blocks/fd-card/fddetailsutil.js"],
  "risk": "low | medium | high",
  "alternatives": ["short list of other approaches considered"],
  "needs_review": false
}
```

If `needs_review: true`, the entry is still added to the plan with status `needs_review` so the user can decide what to do — this never silently drops an error.

### 3.2 Present plan

Print a numbered table:

```
# Fix Plan — <N> entries

[1] TypeError — fdPanel.forEach is not a function
    file       : blocks/fd-card/fddetailsutil.js:59
    root cause : <one line>
    approach   : <one line>
    scope      : single-line   risk : low

[2] ReferenceError — _satellite is not defined
    file       : blocks/fd-card/analytics.js:79
    root cause : <one line>
    approach   : <one line>
    scope      : page-level    risk : medium

Commands: approve | skip <N> | redo <N>: <guidance> | add: <error> | regenerate | cancel
```

### 3.3 Iteration loop

Read `references/plan-iteration.md` for the deterministic state machine, command grammar, and exit conditions. The orchestrator:

- Parses user input against the fixed command grammar.
- Mutates `plan[]` per the rules in that file.
- Re-prints the updated plan after every command.
- Loops until the user issues `approve` (or `fix it` / `proceed`).

If the user issues `cancel`: print `"Run cancelled — no changes made."` and exit. No branch, no commit, no Edit.

### 3.4 Approval

On `approve`, freeze the plan: every non-`needs_review` entry becomes a fix task for Phase 4. `needs_review` entries are carried into the PR's "Manual review needed" section (Phase 6.3) instead of being applied. Proceed to Phase 4 immediately — do **not** ask again.

---

## Phase 4 — Apply Approved Fixes

> Pre-condition (verify before doing anything in this phase): the user issued `approve` / `fix it` / `proceed` in Phase 3.3. If not, you are not in Phase 4 — go back to 3.

### 4.1 Branch + run-output dir

Resolve `REPO_PATH` if not yet set (Phase 1 fallback). If `pwd` is not in a git repo and the user gave no path: ask. If a URL is given and no clone exists: `git clone <URL> ~/auto-fix-form-clones/<repo-name>` and use that as `REPO_PATH`.

Resolve `BASE_BRANCH` (ask if not provided).

After `git checkout -b`, **verify** the branch is correct before any Edit:

```bash
CURRENT=$(git -C "$REPO_PATH" rev-parse --abbrev-ref HEAD)
case "$CURRENT" in
  fix/auto-fix-*) ;;                         # OK
  *) echo "ABORT: HEAD is $CURRENT, expected fix/auto-fix-*"; exit 1 ;;
esac
```

If this check fails, do **not** proceed to 4.2 — the branch was not created. Re-run `git checkout -b "$FIX_BRANCH"` from `BASE_BRANCH` and re-verify.

```bash
git -C "$REPO_PATH" checkout "$BASE_BRANCH"
git -C "$REPO_PATH" pull origin "$BASE_BRANCH"
FIX_BRANCH="fix/auto-fix-<form-slug>-<TODAY>"           # <TODAY> = YYYYMMDD from env
git -C "$REPO_PATH" checkout -b "$FIX_BRANCH"

RUN_OUTPUT_DIR="output/<domain-or-mode-b-repo>-<TODAY-YYYY-MM-DD>"
mkdir -p "$RUN_OUTPUT_DIR"
```

`<form-slug>` rules:
- **Mode A:** last non-empty path segment of `FORM_URL`, slugified (`tr '[:upper:]/' '[:lower:]-'`), query string stripped.
- **Mode B:** filename of the first error without extension; fallback `$(basename "$REPO_PATH")`.

### 4.2 Generate patches per approved plan entry

For each approved entry, spawn a fix sub-agent using `assets/fix-sub-agent-prompt.md`. The prompt is seeded with the entry's `root_cause` and `approach` so the sub-agent does not re-derive them. Parallelism rules from 3.1 apply.

For page-level and repo-search entries, run the grep / find recipe from `references/fix-classification.md` first, then pass the results to the sub-agent.

Each sub-agent returns:
```json
{ "file_relative": "...", "old_string": "...", "new_string": "...", "explanation": "one sentence" }
```
or `{ "needs_review": true, "analysis": "..." }` if the patch turned out to be non-trivial after deeper inspection. `needs_review` here is rare (the plan was already approved); if it happens, append to `needsReview[]` and continue.

### 4.3 Apply patches (NO commit)

For each non-`needs_review` patch, in order:

```
Read(<REPO_PATH>/<file_relative>)                     # fresh read
verify old_string appears EXACTLY ONCE
Edit(<REPO_PATH>/<file_relative>, old_string, new_string)
errorFixedFiles[] += <file_relative>                   # de-duplicated
```

If `old_string` is not unique, expand it with more surrounding context (re-spawn the sub-agent if needed). Working tree must remain dirty — no `git commit` here. The combined commit happens in Phase 6.1 after perf-bot has either passed or hit the iteration cap.

After 4.3, `git status` shows modified files; `git log` still points at `BASE_BRANCH`'s tip.

---

## Phase 5 — Performance-Bot Diff Gate

Mandatory. Reads `references/perf-bot-violations.md` for parsing rules and per-type fix recipes. Because Phase 4.3 left the working tree dirty and `HEAD == BASE_BRANCH`'s tip, `--diff HEAD` captures all uncommitted error+perf changes cumulatively across iterations.

### 5.1 Ensure CLI installed + report ignored

```bash
if [ ! -f "$HOME/.performance-bot/index.js" ]; then
  mkdir -p "$HOME/.performance-bot"
  curl -L https://github.com/adobe-aem-forms/performance-bot/releases/latest/download/performance-bot-cli.tar.gz \
    | tar -xz -C "$HOME/.performance-bot" || PERF_BOT_INSTALL_FAILED=1
fi

NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
[ -z "$NODE_MAJOR" ] || [ "$NODE_MAJOR" -lt 20 ] && PERF_BOT_NODE_TOO_OLD=1

if ! grep -qxF '.perf-bot-report.md' "$REPO_PATH/.gitignore" 2>/dev/null; then
  printf '\n.perf-bot-report.md\n' >> "$REPO_PATH/.gitignore"
fi
```

If install or Node check fails, append a `needsReview[]` entry and skip directly to Phase 6.1 — the deferred error-fix commit still happens.

### 5.2 Run loop (max 3 iterations)

For each iteration (1 to 3):

1. `cd "$REPO_PATH" && rm -f .perf-bot-report.md && node ~/.performance-bot/index.js --diff HEAD --output ./.perf-bot-report.md`
2. Snapshot: `cp "$REPO_PATH/.perf-bot-report.md" "$RUN_OUTPUT_DIR/perf-bot-report-iter${ITER}.md"`.
3. If the report is missing / < 40 bytes / has no recognised section header → push `needsReview[]` "perf-bot report missing/malformed at iter <N>" and break.
4. Parse violations per `references/perf-bot-violations.md`. If 0 violations → break. If ITER == 3 → record remaining as "Performance follow-ups" and break.
5. Spawn one Agent per violation using `assets/perf-bot-fix-prompt.md`. Different files in parallel (single message, multiple `Agent` uses); same file sequentially.
6. For each non-`needs_review` JSON result: `Read` → verify `old_string` unique → `Edit`. Append to `perfFixedFiles[]` and `fixedViolations[]`. `needs_review` results go to `needsReview[]`.

Track `fixedViolations[]` for the PR body and `perfFixedFiles[]` (de-duplicated) for the Phase 6.1 stage list.

### 5.3 Capture artifacts

In `$RUN_OUTPUT_DIR`, save each iteration's CLI command, each `perf-bot-report-iter<N>.md`, the parsed `violations[]` table, and every sub-agent prompt + JSON result. `.perf-bot-report.md` is never committed.

---

## Phase 6 — Commit, Push, PR

### 6.1 Single combined commit

The only commit on the fix branch — bundles Phase 4 error fixes and Phase 5 perf fixes (both developed against the same dirty tree).

```bash
mv "$REPO_PATH/.perf-bot-report.md" "$RUN_OUTPUT_DIR/perf-bot-report-final.md" 2>/dev/null || true

ALL_FIXED_FILES=$(printf '%s\n' "${errorFixedFiles[@]}" "${perfFixedFiles[@]}" | sort -u)

if [ -n "$ALL_FIXED_FILES" ]; then
  ( cd "$REPO_PATH" && echo "$ALL_FIXED_FILES" | xargs git add -- )
  git -C "$REPO_PATH" commit -m "fix: <N> form errors + <M> perf-bot violations on <form page name>

Errors fixed:
<one bullet per Phase 4 patch: file:line — explanation>

Performance-bot violations fixed (--diff HEAD):
<one bullet per fixedViolations[]: file:line — type — explanation>"
fi
```

If perf-bot was unavailable, still commit error fixes — the perf section becomes "0 violations checked — perf-bot CLI unavailable, see Performance follow-ups."

If `errorFixedFiles[]` and `perfFixedFiles[]` are both empty: skip the commit, append `needsReview[] += "no fixes applied"`, let 6.3 decide whether to open the PR.

Never `git add -A` / `git add .` — only the orchestrator-tracked files.

### 6.2 Push

```bash
git -C "$REPO_PATH" push origin "$FIX_BRANCH"
```

If push fails, surface the command for manual run and continue with `needsReview[] += "branch not pushed"`.

### 6.3 Raise PR

```bash
ORG_REPO=$(gh repo view "$REPO_PATH" --json nameWithOwner -q .nameWithOwner 2>/dev/null \
           || git -C "$REPO_PATH" remote get-url origin \
              | sed -E 's#(git@|https://)github.com[:/]##; s#\.git$##')

gh pr create \
  --repo "$ORG_REPO" \
  --base "$BASE_BRANCH" \
  --head "$FIX_BRANCH" \
  --title "fix: auto-fix <N> form errors — <form page name>" \
  --body "..."
```

PR body sections, in order:

1. **Plan summary** — the approved plan from Phase 3 (one row per entry: file, error, approach, status: applied / skipped / needs_review).
2. **Errors fixed** — table from Phase 4 (file, line, error, fix explanation).
3. **Performance-bot violations fixed** — table from Phase 5 (file, line, type, explanation). "0 violations" if first iteration was clean. "perf-bot CLI unavailable" if 5.1 failed.
4. **Performance follow-ups** — every `needsReview[]` entry from Phase 5 + violations remaining after iteration 3.
5. **Manual review needed** — `needs_review` entries from Phase 4.2 + `needs_review`-status plan entries from Phase 3.
6. **Form context** — URL (or "Mode B"), steps covered (`window.__stepLog`), telemetry counts.
7. **Test plan** — checklist.

If `gh` is missing, print the push command + compare URL: `https://github.com/$ORG_REPO/compare/$BASE_BRANCH...$FIX_BRANCH`. Return the PR URL on success.

---

## Phase 7 — Run Report

Write to `$RUN_OUTPUT_DIR/auto-fix-report.md`. Required sections:

- **Header** — URL (or "Mode B"), date, PR URL
- **Phases 1, 2A/2B/2C, 2.M** — resolved paths, telemetry tables, live diagnosis output, parsed errors, merged `allErrors[]`
- **Phase 3** — every command issued and its plan diff, final approved plan, `needs_review` entries
- **Phase 4** — fix sub-agent prompts + JSON, `errorFixedFiles[]`, uncommitted diff
- **Phase 5** — per iteration: CLI command, report snapshot, parsed violations, sub-agent prompts + JSON, applied/skipped split
- **Phase 6** — staged files, commit message + SHA, push output, PR URL
- **Errors not fixed** + **Performance follow-ups** — one row per skipped item with reason

Print: `📄 Run report saved: $RUN_OUTPUT_DIR/auto-fix-report.md`

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Only error strings, no URL | Mode B — skip 2A/2B |
| `/optel-query` fails or no data | Log; proceed to 2B with telemetry-only entries |
| URL is not production | Skip 2A; go to 2B |
| Chrome DevTools MCP tools fail with a connection error at any point (list_pages errors, "browser already running", evaluate_script returns MCP error) | Stop Phase 2B immediately. Tell user to close Chrome and retry, or type `skip-live`. **Never** use Bash/curl/WebSocket as a CDP fallback. If user types `skip-live`, set `LIVE_DEBUG_FAILED` and proceed to 2.M with telemetry errors only. |
| live-debug-form Steps 1/2 cannot resolve the form (resolver returns no panels, page redirects off-domain on initial load, form runs inside a Web Worker) | Inform user; **still go through Phase 3** with telemetry-only errors. Do not skip the gate. |
| User cannot provide credentials | Offer Mode B |
| `file` is the page URL (no `.js`) | Page-level fix — see `references/fix-classification.md` |
| No URL, filename only | Repo-search fix — see `references/fix-classification.md` |
| Source file 404 | Ask for local path |
| Minified file | Flag "cannot auto-fix"; suggest source maps |
| Phase 3 — `cancel` | Discard plan; no branch, no Edit; clean exit |
| Phase 3 — `redo N` / `regenerate` | Re-spawn planning sub-agent(s) per `references/plan-iteration.md` |
| Phase 3 — unrecognised input | Print grammar; remain in `AWAITING_INPUT` |
| Phase 3 — plan empty after skips | Ask `add: <error>` or `cancel`; never auto-approve empty |
| Phase 4.2 sub-agent returns `needs_review` | Add to PR "Manual review needed"; continue |
| `old_string` not unique | Expand context; re-spawn sub-agent if needed |
| Phase 5 CLI missing / Node < 20 / install fails | Set `PERF_BOT_INSTALL_FAILED`; skip 5.2; commit error fixes; surface in PR |
| Phase 5.2 — violations after iter 3 | Move remaining to "Performance follow-ups"; do not loop |
| Phase 5.2 sub-agent returns `needs_review` | Add to "Performance follow-ups" |
| `.perf-bot-report.md` missing/malformed | `needsReview` entry; break loop; proceed to 6.1 |
| Both `errorFixedFiles[]` and `perfFixedFiles[]` empty | Skip commit; let 6.3 decide whether to open PR |
| `pwd` not in any git repo, no `REPO_PATH` given | Ask user (Rule #6) |
| Run interrupted between 4.3 and 6.1 | On retry, ask whether to discard or stash — never auto-discard |
| `git push` fails | Show command; continue to 6.3 with `needs_review "branch not pushed"` |

---

## Example invocations

**Mode A:**
```
Auto-fix all errors on https://applyonline.hdfc.bank.in/digital/etb-fixed-deposit-cc,
repo at /Users/me/workspace/hdfc-bank-uat, branch uat-cards-release-test
```

**Mode B:**
```
Fix these errors in /path/to/repo on branch main:
fdSelectHandler@https://host/eds-v1-forms/fd-card/fddetailsutil.js:59:11 | typeerror: fdPanel.forEach is not a function
@https://host/eds-v1-forms/fd-card/analytics.js:79:3 | referenceerror: _satellite is not defined
```
