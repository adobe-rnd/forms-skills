---
name: auto-fix-form
description: End-to-end workflow for diagnosing and fixing AEM/EDS form errors. Queries telemetry via /optel-query, presents errors to the user for selection, uses the impact-analyser graph to trace error origins across the repo landscape, generates a per-error fix plan the user iterates on until approved, applies patches through parallel sub-agents, gates the working tree through performance-bot --diff HEAD, runs impact analysis to propagate analogous fixes into dependent repos, and raises a PR per repo. Use when the user provides a form URL to fix.
compatibility: Requires git + gh CLI for PR creation. Phase 5 requires Node 20+ and the performance-bot CLI at ~/.performance-bot/index.js — installed inline on first run if missing. Phases 5.5/5.6 require the impact-analyser CLI (`ia`) at /Users/subodhj/Desktop/workspace/impact-analyser/impact-analyser/src/cli.js (or `ia` in PATH) and a customer config YAML + graph DB in the repo; degrade gracefully if absent.
allowed-tools: Read Write Edit Bash Glob Grep Agent Skill WebFetch AskUserQuestion
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
1 → 2A → 2.S (user selects errors) → 2.M → 3 → [user: approve] → 4 → 5 → 5.5 → 5.6 → 6 → 7
                                                 ▲
                                                 └── ONLY user input crosses this gate
```

You may **not** skip Phase 3 because:
- Telemetry "made the fix obvious" — still go through Phase 3.
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
| 6 | **REPO_PATH must be set before Phase 2** | Defer to Phase 4.1 | Auto-resolve from `pwd` in Phase 1; if not in a git repo, ask the user immediately — never continue with an unset path |
| 7 | **Never commit before performance-bot has run** | Commit after Phase 4, then run perf-bot | Apply fixes to working tree, run `--diff HEAD`, fix violations, **then** commit (Phase 6.1) |
| 8 | **Never skip Phase 5 because CLI is missing** | "perf-bot not installed — skipping" | Install inline (`mkdir -p ~/.performance-bot && curl … \| tar -xz -C ~/.performance-bot`); only after install fails, set `PERF_BOT_INSTALL_FAILED` and surface in PR |
| 9 | **Never loop the perf-bot gate forever** | Retry until clean | Cap at 3 iterations; remaining violations → "Performance follow-ups" in PR |
| 10 | **Sub-agents return JSON only — orchestrator owns Edit** | Sub-agent calls Edit | Sub-agent returns `{file_relative, old_string, new_string, …}`; orchestrator validates uniqueness then applies |
| 11 | **Orchestrator does not analyse source files** | Bash `sed`/`cat`/`grep` on a `.js` file before Phase 4 | All analysis is delegated to planning sub-agents (Phase 3.1) and fix sub-agents (Phase 4.2) |
| 12 | **Cancel cleanly** | Half-applied patches on disk after `cancel` | Phase 3 cancel → discard plan, no Edit, no branch. Phase 4+ cancel → branch exists, document in report |

---

## Role split

`auto-fix-form` is the orchestrator. It delegates: telemetry to `/optel-query` (2A), IA graph triage to the `ia` CLI (2.M + 3.1), planning to plan sub-agents (3.1), patching to fix sub-agents (4.2), perf-bot lint to the local CLI + per-violation sub-agents (5), impact analysis + cross-repo propagation to `ia` CLI + cross-repo sub-agents (5.5/5.6), and git/gh for branch, commit, push, PR (4.1, 5.6.6, 6.1–6.3). The orchestrator owns all `Edit` calls; sub-agents return JSON only.

---

## Invocation

| Parameter | Required | Description |
|-----------|----------|-------------|
| `FORM_URL` | Yes | Production URL of the form page |
| `REPO_PATH` | No | Local repo path — auto-resolved from `pwd` if inside a git repo; asked in Phase 4.1 if not |
| `BASE_BRANCH` | No | Base branch for the fix PR — asked in Phase 4.1 if omitted |
| `DATE_RANGE` | No | Telemetry date range (`YYYY-MM-DD:YYYY-MM-DD`); defaults to `<TODAY>:<TODAY>` |

---

## Phase 1 — Input Resolution

1. **Validate** `FORM_URL` is present. If not, ask for it before proceeding.
2. **Resolve `REPO_PATH`** — must be known before Phase 2 so IA tooling can be located:

   ```bash
   if git -C "$PWD" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
     REPO_PATH=$(git -C "$PWD" rev-parse --show-toplevel)
     REPO_REMOTE=$(git -C "$REPO_PATH" remote get-url origin 2>/dev/null || echo "no remote")
     echo "Resolved REPO_PATH: $REPO_PATH (origin: $REPO_REMOTE)"
   else
     # Not in a git repo — ask the user immediately. Do not proceed until answered.
     AskUserQuestion("The current directory is not inside a git repository.
   Please provide the local path to the cloned repo where the fix should be applied:")
     REPO_PATH="<user answer>"
     REPO_REMOTE=$(git -C "$REPO_PATH" remote get-url origin 2>/dev/null || echo "no remote")
     echo "Using REPO_PATH: $REPO_PATH (origin: $REPO_REMOTE)"
   fi
   ```

   If the user-supplied path does not exist or is not a git repo, tell them and ask again. Do not continue with an invalid path.

3. **Resolve IA tooling early** (same logic as Phase 5.5.1 — do it now so 2.M can use it):

   ```bash
   if command -v ia >/dev/null 2>&1; then
     IA_CMD="ia"
   elif [ -f "/Users/subodhj/Desktop/workspace/impact-analyser/impact-analyser/src/cli.js" ]; then
     IA_CMD="node /Users/subodhj/Desktop/workspace/impact-analyser/impact-analyser/src/cli.js"
   else
     IA_UNAVAILABLE="ia CLI not found"
   fi

   IA_CONFIG=$(find "$REPO_PATH" -maxdepth 3 \
     \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
     2>/dev/null | head -1)
   [ -z "$IA_CONFIG" ] && IA_UNAVAILABLE="${IA_UNAVAILABLE:+$IA_UNAVAILABLE; }no impact-analyzer.config.yaml found"

   IA_GRAPH=$(find "$REPO_PATH" -maxdepth 3 -name "impact-graph.sqlite" 2>/dev/null | head -1)
   [ -z "$IA_GRAPH" ] && IA_GRAPH=$(find "$HOME/.impact-analyser" -name "impact-graph.sqlite" 2>/dev/null | head -1)
   ```

Print resolved values once. `BASE_BRANCH` is asked in Phase 4.1 unless provided.

---

## Phase 2 — Error Discovery

The output of this phase is a classified, user-selected `allErrors[]`. Each entry: `{ type, message, file, fileUrl, line, col, source, count, pct_sessions_affected, iaContext? }`.

### 2A — Telemetry query

Skip when `FORM_URL`'s host is `aem.page` / `aem.live` / `hlx.page` / `hlx.live` / `localhost` (non-production — no telemetry).

Use `<TODAY>` from environment context as both `startDate` and `endDate` unless `DATE_RANGE` was provided. Never `Bash(date)`.

```
Skill("optel-query", "Get all JavaScript errors for <FORM_URL> on <TODAY>.
Return: { message, file, line, count, pct_sessions_affected }. Sort by count desc.")
```

Read `references/fix-classification.md` for classification + dedup rules. Show a numbered table of fixable errors:

```
#  | Type          | Message (truncated)            | File : Line  | Count | Sessions %
---|---------------|--------------------------------|--------------|-------|----------
1  | TypeError     | fdPanel.forEach is not a func  | fddetail:59  | 1 204 | 34 %
2  | ReferenceError| _satellite is not defined      | analytics:79 |   87  |  4 %
```

Plus a "Skipped" list (duplicate, minified, infra error) with reasons.

Ask: **"Which error(s) to fix? Enter number(s), comma-separated, or 'all':"**

Wait for the user's reply. Filter to `selectedErrors[]`. If `allErrors[]` is empty before asking, print `"Form appears healthy — no JS errors detected."` and exit with a brief Phase 7 report.

### 2.M — IA graph triage + finalise allErrors[]

`selectedErrors[]` becomes `allErrors[]` after this step enriches each entry with IA context.

**If `IA_GRAPH` is available**, run `ia triage` for each selected error to map it to impacted graph nodes. This gives plan sub-agents (Phase 3.1) the graph trail — which Java classes, clientlibs, OSGi services, or EDS blocks are upstream of the error file — so they can propose a deeper root-cause fix rather than a surface patch.

```bash
for each entry in selectedErrors[]:
  # Write the error's stack-trace-like signature to a tmp file
  echo "<type>: <message>\n  at <file>:<line>" > /tmp/ia-triage-input.txt

  eval $IA_CMD triage --graph "$IA_GRAPH" < /tmp/ia-triage-input.txt \
    > "$RUN_OUTPUT_DIR/ia-triage-<error_id>.json" 2>/dev/null

  # Attach the triage JSON as iaContext on the allErrors[] entry (best-effort)
  entry.iaContext = (parse $RUN_OUTPUT_DIR/ia-triage-<error_id>.json) || null
```

If `IA_GRAPH` is absent, skip triage — `iaContext` is null for all entries and plan sub-agents fall back to source-only analysis.

**After triage, check if the fix targets a different repo.** For each entry where `iaContext` identifies a source repo that differs from `basename("$REPO_PATH")`, collect the distinct foreign repo names. If any are found, print a summary and ask once:

```
⚠️  The impact-analyser traces the following errors to a different repo:

  Error [1] — TypeError: fdPanel.forEach is not a function
    Origin repo : HDFC_FormsCommon  (trail: ← Calls ← MavenDependsOn ← changed)
  Error [3] — ReferenceError: _satellite is not defined
    Origin repo : HDFC_Analytics

  Your current working repo is: hdfc-bank-uat

Do you have these repos cloned locally?
  • HDFC_FormsCommon → enter path (or 'skip' to fix in current repo):
  • HDFC_Analytics   → enter path (or 'skip' to fix in current repo):
```

Wait for the user's reply for each repo. For each supplied path:
- Validate: `git -C "<path>" rev-parse --is-inside-work-tree` — re-ask once if invalid.
- Set `entry.targetRepoPatch = { repoPath: "<path>", repoName: "<name>" }` on all errors whose `iaContext` points to that repo.

For errors where the user typed `skip` or no path was given: `entry.targetRepoPatch = null` — plan sub-agents will search `REPO_PATH` instead.

Display a final confirmation table (error, file:line, count, target repo, iaContext summary). Proceed to Phase 3.

---

## Phase 3 — Plan Generation & Iteration

> 🛑 **HARD GATE.** No `Edit`, `Write`, `git checkout -b`, or `git commit` is allowed until the user issues `approve` / `fix it` / `proceed` in 3.3. This applies even when there is only one error and even when telemetry "made the fix obvious" — still go through this phase.

> The orchestrator does NOT read source files for analysis here. The planning sub-agents (3.1) own all source-reading. If you find yourself running `Bash sed`/`cat`/`grep` or `Read` on a `.js` / `.css` / `.html` file before Phase 4, you are bypassing the gate.

### 3.1 Generate plan entries

For each entry in `allErrors[]`, spawn a planning sub-agent using `assets/plan-sub-agent-prompt.md`. Seed the prompt with:
- `entry.iaContext` (if non-null) — the IA graph trail for deeper root-cause analysis.
- `entry.targetRepoPatch.repoPath` (if non-null) — the repo the sub-agent should read when locating the code; otherwise use `REPO_PATH`.

Parallelism rules:

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

### 4.1 Branch per target repo + run-output dir

The approved plan may contain entries targeting different repos (`entry.targetRepoPatch.repoPath` vs `REPO_PATH`). Group plan entries by their target repo and create one fix branch per repo.

```bash
# Collect unique target repos across all approved entries
# (null targetRepoPatch → REPO_PATH)
declare -A TARGET_REPOS   # repoPath → BASE_BRANCH
for each approved entry:
  T=${entry.targetRepoPatch.repoPath:-$REPO_PATH}
  TARGET_REPOS["$T"]=""
```

For each `T` in `TARGET_REPOS`:

1. Verify the repo is valid:
   ```bash
   git -C "$T" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
     || { echo "ABORT: '$T' is not a git repo"; exit 1; }
   ```

2. Resolve `BASE_BRANCH` for this repo (ask once per repo if not provided; default is the repo's current default branch).

3. Branch:
   ```bash
   git -C "$T" checkout "$BASE_BRANCH"
   git -C "$T" pull origin "$BASE_BRANCH"
   FIX_BRANCH="fix/auto-fix-<form-slug>-<TODAY>"
   git -C "$T" checkout -b "$FIX_BRANCH"
   TARGET_REPOS["$T"]="$FIX_BRANCH"
   ```

4. Verify branch:
   ```bash
   CURRENT=$(git -C "$T" rev-parse --abbrev-ref HEAD)
   [[ "$CURRENT" == fix/auto-fix-* ]] || { echo "ABORT: HEAD is $CURRENT"; exit 1; }
   ```

```bash
RUN_OUTPUT_DIR="output/<form-slug>-<TODAY-YYYY-MM-DD>"
mkdir -p "$RUN_OUTPUT_DIR"
```

`<form-slug>`: last non-empty path segment of `FORM_URL`, slugified. Fallback: `$(basename "$REPO_PATH")`.

### 4.2 Generate patches per approved plan entry

For each approved entry, spawn a fix sub-agent using `assets/fix-sub-agent-prompt.md`. The prompt is seeded with the entry's `root_cause` and `approach` so the sub-agent does not re-derive them. Parallelism rules from 3.1 apply.

For page-level and repo-search entries, run the grep / find recipe from `references/fix-classification.md` first, then pass the results to the sub-agent.

Each sub-agent returns:
```json
{ "file_relative": "...", "old_string": "...", "new_string": "...", "explanation": "one sentence" }
```
or `{ "needs_review": true, "analysis": "..." }` if the patch turned out to be non-trivial after deeper inspection. `needs_review` here is rare (the plan was already approved); if it happens, append to `needsReview[]` and continue.

### 4.3 Apply patches (NO commit)

For each non-`needs_review` patch, resolve the target repo and apply:

```
T = entry.targetRepoPatch.repoPath  (or REPO_PATH if null)

Read(<T>/<file_relative>)                              # fresh read
verify old_string appears EXACTLY ONCE
Edit(<T>/<file_relative>, old_string, new_string)
errorFixedFiles[T] += <file_relative>                  # keyed by repo, de-duplicated
```

If `old_string` is not unique, expand context (re-spawn sub-agent if needed). No `git commit` at this point — all repos' working trees stay dirty until Phase 6.1.

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

## Phase 5.5 — Impact Analysis

Runs after the working tree is fully patched (Phase 4.3 + Phase 5 perf fixes) and before the commit. Analyses what other repos, forms, and journeys are affected by the changes, producing a reviewer-facing markdown report that is embedded in the PR body.

This phase is **best-effort**: if the config or CLI is missing it degrades gracefully — the commit and PR still happen. Never block Phase 6 due to an IA failure.

### 5.5.1 Resolve IA tooling

```bash
# Locate the ia CLI (try PATH first, then the known local dev install)
if command -v ia >/dev/null 2>&1; then
  IA_CMD="ia"
elif [ -f "/Users/subodhj/Desktop/workspace/impact-analyser/impact-analyser/src/cli.js" ]; then
  IA_CMD="node /Users/subodhj/Desktop/workspace/impact-analyser/impact-analyser/src/cli.js"
else
  IA_UNAVAILABLE="ia CLI not found"
fi
```

### 5.5.2 Resolve config and graph DB

```bash
# Config — mandatory for ia analyse; search the repo first, then well-known locations
IA_CONFIG=$(find "$REPO_PATH" -maxdepth 3 \
  \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
  2>/dev/null | head -1)

if [ -z "$IA_CONFIG" ]; then
  IA_UNAVAILABLE="${IA_UNAVAILABLE}; no impact-analyzer.config.yaml found in $REPO_PATH"
fi

# Graph DB — optional; enables D1 code-impact and D3 journey-impact sections
IA_GRAPH=$(find "$REPO_PATH" -maxdepth 3 -name "impact-graph.sqlite" 2>/dev/null | head -1)
[ -z "$IA_GRAPH" ] && IA_GRAPH=$(find "$HOME/.impact-analyser" -name "impact-graph.sqlite" 2>/dev/null | head -1)

# --concept-only when no graph (suppresses the "D1+D3 will be empty" warning)
IA_GRAPH_FLAG=""
[ -n "$IA_GRAPH" ] && IA_GRAPH_FLAG="--graph \"$IA_GRAPH\""
[ -z "$IA_GRAPH" ] && IA_CONCEPT_ONLY="--concept-only"
```

### 5.5.3 Generate diff file and run analysis

Run `ia analyse` in `--format json` mode — this gives both the rendered markdown (`result.markdown`) and structured data (`result.codeChanges`, `result.affectedForms`) that Phase 5.6 needs for cross-repo fix propagation.

```bash
if [ -z "$IA_UNAVAILABLE" ]; then
  IA_DIFF_FILE="$RUN_OUTPUT_DIR/ia-diff-files.txt"

  # ia analyse expects a text file with one absolute file path per line
  git -C "$REPO_PATH" diff --name-only HEAD \
    | while IFS= read -r f; do echo "$REPO_PATH/$f"; done \
    > "$IA_DIFF_FILE"

  IA_JSON="$RUN_OUTPUT_DIR/impact-analysis.json"
  IA_REPORT="$RUN_OUTPUT_DIR/impact-analysis.md"

  eval $IA_CMD analyse \
    --config \"$IA_CONFIG\" \
    --diff   \"$IA_DIFF_FILE\" \
    $IA_GRAPH_FLAG \
    $IA_CONCEPT_ONLY \
    --format json \
    > "$IA_JSON" 2>"$RUN_OUTPUT_DIR/ia-stderr.txt"

  IA_EXIT=$?

  if [ $IA_EXIT -ne 0 ] || [ ! -s "$IA_JSON" ]; then
    IA_UNAVAILABLE="ia exited $IA_EXIT — $(cat "$RUN_OUTPUT_DIR/ia-stderr.txt" | head -5)"
  else
    # Extract the rendered markdown from the JSON envelope and save separately
    node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync('$IA_JSON', 'utf8'));
        require('fs').writeFileSync('$IA_REPORT', d.markdown || '');
      } catch(e) { process.exit(1); }
    " 2>/dev/null || cp "$IA_JSON" "$IA_REPORT"
  fi
fi
```

### 5.5.4 Capture output

```bash
if [ -z "$IA_UNAVAILABLE" ] && [ -s "$IA_REPORT" ]; then
  IA_OUTPUT=$(cat "$IA_REPORT")
  echo "✅ Impact analysis complete — saved: $RUN_OUTPUT_DIR/impact-analysis.md"
  IA_TLDR=$(grep -m1 "^##\? " "$IA_REPORT" || head -1 "$IA_REPORT")
  echo "   $IA_TLDR"
else
  [ -z "$IA_UNAVAILABLE" ] && IA_UNAVAILABLE="empty report"
  IA_OUTPUT="<!-- Impact analysis unavailable: $IA_UNAVAILABLE -->"
  echo "⚠️  Impact analysis skipped: $IA_UNAVAILABLE"
fi
```

`IA_OUTPUT` is consumed by Phase 6.3. `IA_JSON` (`impact-analysis.json`) is consumed by Phase 5.6 for structured cross-repo data.

---

## Phase 5.6 — Cross-Repo Fix Propagation

Uses the structured IA output from Phase 5.5 to identify dependent repos, finds analogous errors in each, applies fixes, and raises a separate PR per repo. This phase is **best-effort** and runs only when Phase 5.5 produced a valid `IA_JSON`. The primary-repo commit in Phase 6 never waits for, or is blocked by, this phase.

### 5.6.1 Extract impacted repos from IA JSON

```bash
if [ -z "$IA_UNAVAILABLE" ] && [ -s "$IA_JSON" ]; then
  # Extract unique repo names from D1 codeChanges and D3 affectedForms
  IMPACTED_REPOS=$(node -e "
    try {
      const d = JSON.parse(require('fs').readFileSync('$IA_JSON', 'utf8'));
      const repos = new Set();
      // D1: code-impact consumers
      (d.codeChanges || []).forEach(c => {
        if (c.props?.repo) repos.add(c.props.repo);
        // Also parse from node id: 'REPO_NAME/path/to/file.js:Symbol'
        const seg = (c.id || '').split('/')[0];
        if (seg && !seg.includes('.') && seg !== c.id) repos.add(seg);
      });
      // D3: form/journey repos (tuple[1] is origin, first path segment is repo)
      (d.affectedForms || []).forEach(f => {
        if (Array.isArray(f) && f[1]) repos.add(String(f[1]).split('/')[0]);
      });
      // Remove the primary repo itself
      repos.delete('$(basename "$REPO_PATH")');
      console.log([...repos].filter(Boolean).join('\n'));
    } catch(e) { /* no output = empty list */ }
  " 2>/dev/null)
fi
```

If `IMPACTED_REPOS` is empty, skip directly to Phase 6 — no cross-repo work to do.

### 5.6.2 Resolve local paths for each impacted repo

For each line in `IMPACTED_REPOS`:

```bash
declare -A CROSS_REPO_PATHS   # repo_name → local_path

while IFS= read -r REPO_NAME; do
  [ -z "$REPO_NAME" ] && continue

  # Search order: sibling of REPO_PATH → IA workspace from config → clones dir
  IA_WORKSPACE=$(node -e "
    try {
      const yaml = require('fs').readFileSync('$IA_CONFIG', 'utf8');
      const m = yaml.match(/^workspace:\s*(.+)$/m);
      if (m) console.log(m[1].replace(/\\\${IA_WORKSPACE}/g, process.env.IA_WORKSPACE || '').trim());
    } catch(e) {}
  " 2>/dev/null)

  for CANDIDATE in \
      "$(dirname "$REPO_PATH")/$REPO_NAME" \
      "${IA_WORKSPACE}/$REPO_NAME" \
      "$HOME/auto-fix-form-clones/$REPO_NAME"; do
    if [ -d "$CANDIDATE/.git" ] || [ -d "$CANDIDATE" ]; then
      CROSS_REPO_PATHS["$REPO_NAME"]="$CANDIDATE"
      echo "📂 Found dependent repo $REPO_NAME at $CANDIDATE"
      break
    fi
  done

  if [ -z "${CROSS_REPO_PATHS[$REPO_NAME]}" ]; then
    echo "⚠️  Skipping $REPO_NAME — no local clone found (check sibling dirs or IA workspace)"
  fi
done <<< "$IMPACTED_REPOS"
```

Repos with no local clone are logged and skipped. The orchestrator **never clones** repos in this phase.

### 5.6.3 Spawn cross-repo fix sub-agents

For each resolved `(REPO_NAME, CROSS_REPO_PATH)`, spawn one cross-repo fix sub-agent **per error in `allErrors[]`** using `assets/cross-repo-fix-sub-agent-prompt.md`.

Parallelism:
- **Different repos** → spawn all in parallel (single message, multiple `Agent` tool uses).
- **Same repo, different errors** → sequential (one error at a time; re-read files between sub-agents).

Each sub-agent is seeded with:
- The full `error` entry from `allErrors[]` (type, message, file, line).
- The approved plan entry for that error (root_cause, approach).
- The primary-repo patch applied in Phase 4 (old_string, new_string, file_relative, explanation) — as **reference only**, not to copy verbatim.
- The IA trail string from `codeChanges[]` that links this repo to the changed file — tells the sub-agent *why* this repo is connected.
- `CROSS_REPO_PATH` as the repo root to search.

Each sub-agent returns:
```json
{
  "file_relative": "...",
  "old_string": "...",
  "new_string": "...",
  "explanation": "one sentence"
}
```
or `{ "needs_review": true, "file_relative": "...", "analysis": "..." }`.

### 5.6.4 Apply patches to dependent repos (NO commit yet)

For each non-`needs_review` result, within the corresponding `CROSS_REPO_PATH`:

```
Read(<CROSS_REPO_PATH>/<file_relative>)               # fresh read
verify old_string appears EXACTLY ONCE
Edit(<CROSS_REPO_PATH>/<file_relative>, old_string, new_string)
crossFixedFiles[REPO_NAME] += file_relative            # de-duplicated
```

If `old_string` is not unique, expand context (re-spawn sub-agent if needed). `needs_review` results → `crossRepoNeedsReview[REPO_NAME]`.

### 5.6.5 Perf-bot gate per dependent repo

For each repo with at least one fix applied, run the same perf-bot loop as Phase 5.2 (max 3 iterations) against that repo's working tree:

```bash
cd "$CROSS_REPO_PATH" && node ~/.performance-bot/index.js \
  --diff HEAD --output ./.perf-bot-report.md
```

Skip silently if perf-bot is unavailable — the fix still ships. Record remaining violations in `crossRepoPerfFollowups[REPO_NAME]`.

### 5.6.6 Commit, push, and raise PR per dependent repo

For each repo where `crossFixedFiles[REPO_NAME]` is non-empty:

```bash
CROSS_REPO_PATH="${CROSS_REPO_PATHS[$REPO_NAME]}"

# Detect default branch (prefer main, fall back to master or current HEAD)
CROSS_BASE=$(git -C "$CROSS_REPO_PATH" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null \
              | sed 's|refs/remotes/origin/||' \
              || echo "main")

CROSS_BRANCH="fix/auto-fix-<form-slug>-<TODAY>"
git -C "$CROSS_REPO_PATH" checkout "$CROSS_BASE"
git -C "$CROSS_REPO_PATH" pull origin "$CROSS_BASE"
git -C "$CROSS_REPO_PATH" checkout -b "$CROSS_BRANCH"

# Verify branch before any commit
CROSS_CURRENT=$(git -C "$CROSS_REPO_PATH" rev-parse --abbrev-ref HEAD)
[[ "$CROSS_CURRENT" == fix/auto-fix-* ]] || { echo "ABORT: HEAD is $CROSS_CURRENT"; continue; }

# Stage only orchestrator-tracked files
echo "${crossFixedFiles[$REPO_NAME]}" | xargs -I{} git -C "$CROSS_REPO_PATH" add -- {}

git -C "$CROSS_REPO_PATH" commit -m "fix: cross-repo auto-fix — <N> errors from <primary-repo> on <form-page>

Propagated from: <PRIMARY_PR_URL> (or primary fix branch if PR not yet raised)
Impact-analyser trail: <IA trail for this repo>

Errors fixed:
<one bullet per crossFixedFiles[REPO_NAME]: file:line — explanation>"

git -C "$CROSS_REPO_PATH" push origin "$CROSS_BRANCH"

CROSS_ORG_REPO=$(gh repo view "$CROSS_REPO_PATH" --json nameWithOwner -q .nameWithOwner 2>/dev/null \
                  || git -C "$CROSS_REPO_PATH" remote get-url origin \
                     | sed -E 's#(git@|https://)github.com[:/]##; s#\.git$##')

CROSS_PR_URL=$(gh pr create \
  --repo "$CROSS_ORG_REPO" \
  --base "$CROSS_BASE" \
  --head "$CROSS_BRANCH" \
  --title "fix: cross-repo auto-fix — errors from <form-page>" \
  --body "...")
crossRepoPRs["$REPO_NAME"]="$CROSS_PR_URL"
echo "✅ Cross-repo PR for $REPO_NAME: $CROSS_PR_URL"
```

Cross-repo PR body sections (in order):
1. **Origin** — link to the primary PR (or fix branch), the IA graph trail that connected this repo, the graph DB path and generation timestamp.
2. **Errors fixed** — same table format as Phase 6.3 section 2.
3. **Performance-bot** — violations fixed or "0 violations"; follow-ups if any.
4. **Impact Analysis** — excerpt from `IA_OUTPUT` covering this specific repo's D1 trail.
5. **Manual review needed** — `crossRepoNeedsReview[REPO_NAME]` entries.
6. **Test plan** — checklist focused on the forms/journeys that IA identified as reached by this repo.

If `gh` is missing, print the compare URL. If push fails, record `crossRepoNeedsReview[REPO_NAME] += "branch not pushed"` and continue.

---

## Phase 6 — Commit, Push, PR

### 6.1 One commit per target repo

For each `T` in `TARGET_REPOS` (from Phase 4.1), commit the files fixed in that repo:

```bash
mv "$T/.perf-bot-report.md" "$RUN_OUTPUT_DIR/perf-bot-report-final-<basename T>.md" 2>/dev/null || true

ALL_FIXED=$(printf '%s\n' "${errorFixedFiles[$T]}" "${perfFixedFiles[$T]}" | sort -u)

if [ -n "$ALL_FIXED" ]; then
  ( cd "$T" && echo "$ALL_FIXED" | xargs git add -- )
  git -C "$T" commit -m "fix: <N> form errors + <M> perf-bot violations on <form page name>

Repo: $(basename $T)
Errors fixed:
<one bullet per patch in this repo: file:line — explanation>

Performance-bot violations fixed (--diff HEAD):
<one bullet per fixedViolations[$T]>"
else
  # nothing to commit for this repo — skip, note in PR
  needsReview[] += "no fixes applied in $(basename $T)"
fi
```

Never `git add -A` / `git add .` — only orchestrator-tracked files.

### 6.2 Push (per repo)

For each `T` in `TARGET_REPOS`:

```bash
git -C "$T" push origin "${TARGET_REPOS[$T]}"
```

If push fails for a repo, surface the command and continue with `needsReview[] += "branch not pushed in $(basename $T)"`.

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
5. **Impact Analysis** — full `IA_OUTPUT` from Phase 5.5, embedded verbatim. Covers: TL;DR blast-radius summary, code-impact (D1) cross-repo consumers, functional-impact (D2) concepts touched and their peers, QA test plan (D3) forms and journeys to validate, and repos to redeploy. When `IA_UNAVAILABLE` is set, renders a one-line callout: `> ⚠️ Impact analysis unavailable — <reason>. Run \`ia analyse\` manually before merging.`
6. **Cross-Repo PRs** — table from Phase 5.6 listing every dependent-repo PR raised: `| Repo | PR | Errors fixed | Perf-bot | Status |`. "No dependent repos found" if `crossRepoPRs[]` is empty. "IA graph unavailable — cross-repo propagation skipped" if Phase 5.5 failed. Repos that had a local clone but no analogous error found are listed as "No analogous pattern — skipped". Repos with no local clone are listed as "Clone not found — manual check needed".
7. **Manual review needed** — `needs_review` entries from Phase 4.2 + `needs_review`-status plan entries from Phase 3 + all `crossRepoNeedsReview[]` entries.
8. **Form context** — `FORM_URL`, telemetry date range, error counts from 2A.
9. **Test plan** — checklist.

If `gh` is missing, print the push command + compare URL: `https://github.com/$ORG_REPO/compare/$BASE_BRANCH...$FIX_BRANCH`. Return the PR URL on success.

---

## Phase 7 — Run Report

Write to `$RUN_OUTPUT_DIR/auto-fix-report.md`. Required sections:

- **Header** — `FORM_URL`, date, PR URL(s)
- **Phases 1, 2A, 2.M** — resolved paths, telemetry table, IA triage output per error, final `allErrors[]`
- **Phase 3** — every command issued and its plan diff, final approved plan, `needs_review` entries
- **Phase 4** — fix sub-agent prompts + JSON, `errorFixedFiles[]`, uncommitted diff
- **Phase 5** — per iteration: CLI command, report snapshot, parsed violations, sub-agent prompts + JSON, applied/skipped split
- **Phase 5.5** — IA config path, graph path (or "none"), diff file (`ia-diff-files.txt`), full analysis report (`impact-analysis.md`), raw JSON (`impact-analysis.json`), stderr (`ia-stderr.txt`), `IA_UNAVAILABLE` reason if set
- **Phase 5.6** — per dependent repo: resolved path, sub-agent prompts + JSON results, patches applied, perf-bot snapshots, commit SHA, PR URL; unresolved repos list; `crossRepoNeedsReview[]` entries
- **Phase 6** — staged files, commit message + SHA, push output, PR URL
- **Errors not fixed** + **Performance follow-ups** — one row per skipped item with reason

Print: `📄 Run report saved: $RUN_OUTPUT_DIR/auto-fix-report.md`

---

## Error Handling

| Situation | Action |
|-----------|--------|
| No `FORM_URL` provided | Ask for it before proceeding — do not guess |
| URL is not production (`aem.page` / `hlx.page` / `localhost` etc.) | Skip 2A; ask the user to provide a production URL or enter errors manually for Phase 3 (no telemetry available) |
| `/optel-query` fails or returns no data | Log; ask user whether to enter errors manually or abort |
| `ia triage` fails in 2.M | Log; set `entry.iaContext = null`; continue with source-only plan analysis |
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
| `pwd` not in any git repo | Ask user for the local path of the cloned repo in Phase 1; re-ask if the supplied path is invalid or not a git repo; never continue with an unset path |
| IA triage in 2.M identifies a different origin repo | Ask the user for its local path in 2.M before proceeding to Phase 3; `skip` proceeds with `REPO_PATH` and source-only analysis |
| User-supplied target repo path is invalid / not a git repo | Re-ask once; if still invalid, fall back to `REPO_PATH` and note in plan entry |
| Run interrupted between 4.3 and 6.1 | On retry, ask whether to discard or stash — never auto-discard |
| `git push` fails | Show command; continue to 6.3 with `needs_review "branch not pushed"` |
| Phase 5.5 — `ia` CLI not found and not at known local path | Set `IA_UNAVAILABLE`; skip 5.5.2–5.5.3; PR section shows callout to run manually |
| Phase 5.5 — no `impact-analyzer.config.yaml` found | Set `IA_UNAVAILABLE`; skip analysis; PR section shows callout |
| Phase 5.5 — no graph DB found | Use `--concept-only`; D1 + D3 sections will be empty but D2 concept analysis still runs |
| Phase 5.5 — `ia analyse` exits non-zero or produces empty output | Set `IA_UNAVAILABLE`; log stderr to `ia-stderr.txt`; continue to Phase 6 |
| Phase 5.6 — `IA_JSON` missing or Phase 5.5 failed | Skip Phase 5.6 entirely; note in PR "cross-repo propagation skipped — IA unavailable" |
| Phase 5.6 — no impacted repos in IA JSON | `IMPACTED_REPOS` empty; skip Phase 5.6; primary PR notes "no dependent repos identified" |
| Phase 5.6 — dependent repo has no local clone | Log skip; list in PR "Clone not found — manual check needed"; never auto-clone |
| Phase 5.6 — cross-repo sub-agent returns `needs_review` | Add to `crossRepoNeedsReview[REPO_NAME]`; include in PR "Manual review needed"; continue other repos |
| Phase 5.6 — `old_string` not unique in dependent repo | Expand context and re-spawn sub-agent once; if still not unique → `needs_review` |
| Phase 5.6 — `git push` fails for a dependent repo | Log error; add `crossRepoNeedsReview[REPO_NAME] += "branch not pushed"`; continue other repos |
| Phase 5.6 — branch HEAD check fails for a dependent repo | Re-run `git checkout -b`; if still wrong → skip repo, add to `crossRepoNeedsReview[]` |

---

## Example invocations

```
Auto-fix all errors on https://applyonline.hdfc.bank.in/digital/etb-fixed-deposit-cc,
repo at /Users/me/workspace/hdfc-bank-uat, branch uat-cards-release-test
```

```
Fix errors on https://applyonline.hdfc.bank.in/digital/pl-journey
```
