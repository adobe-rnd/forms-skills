---
name: auto-fix-journey
description: Fixes backend Java errors in AEM Forms. Three entry points: (1) Fix mode — user provides a stack trace or class+line; (2) API Error mode — user says an API is returning 500/400, skill queries Splunk, analyzes root cause, then proceeds to fix if confident; (3) Splunk mode — explicit log exploration (aggregated errors, journey traces, FDM analytics). Uses impact-analyser graph for repo/file routing and post-fix blast-radius analysis.
compatibility: Requires git + gh CLI for branch/PR creation. Impact-analyser CLI (`ia`) required for triage and post-PR analysis — degrades gracefully if absent. Python 3 + splunk-sdk required only for Splunk mode.
allowed-tools: Read Write Edit Bash Agent AskUserQuestion
user_invocable: true
metadata:
  author: adobe-forms
  domain: forms-debugging
---

# Auto Fix Journey

Three distinct entry points. Read the user's message and pick exactly one:

| User message contains… | Entry point |
|------------------------|-------------|
| An error, exception, stack trace, class name, or line reference | **Fix mode** — start at Step 1 |
| An API path/route + "500", "400", "failing", "broken", "error" — without a stack trace | **API Error mode** — start at Step E0 |
| "show errors", "query Splunk", "what's failing", "trace journey", "show logs", "analytics", "FDM performance", "failure rate", "drill deeper" | **Splunk mode** — start at Step S0 |

**Default is Fix mode.** Do not call Splunk unless the user provides an API route (API Error mode) or explicitly asks to query logs (Splunk mode).

---

## Tool files

```
tools/
├── splunk-runner.py              — Splunk Modes A/B/C runner (Splunk mode only)
├── splunk-runner-analytics.py    — Splunk Mode D runner (Splunk mode only)
├── spl-mode-a.spl                — Mode A: ERROR aggregation
├── spl-mode-b.spl                — Mode B: INFO failure analysis
├── spl-mode-c.spl                — Mode C: Journey trace
├── spl-mode-d.spl                — Mode D: FDM API Analytics
├── spl-mode-e.spl                — Mode E: API Error lookup (500/400 by API path)
├── spl-drill-d1.spl              — Drill: Volume by hour
├── spl-drill-d2.spl              — Drill: Distribution by host
├── spl-drill-d3.spl              — Drill: Sample journey IDs
├── spl-journey-stack.spl         — Full exception stack for class+journey
├── spl-journey-info-context.spl  — Non-PII INFO+ERROR context for a journey
└── sub-agent-prompt-java.md      — Java fix sub-agent prompt template
```

## Knowledge files

```
knowledge/
├── error-categories.md   — Category naming rules + analyst-narrative format (Splunk mode)
├── fix-classifier.md     — Structural / Logic / Framework classification rules
└── repos.md              — Package-prefix → git repo manifest (fallback when IA unavailable)
```

---

# FIX MODE

## Step 1 — Collect the error

Accept any of these from the user's message (no Splunk query needed):

- Full or partial stack trace
- Exception type + message (e.g. `NullPointerException: Cannot invoke method getStatus()`)
- Class name + approximate line number (e.g. `JourneyHelperServiceImpl:142`)
- Raw log line pasted from any source

Extract and record:
- `EXCEPTION_TYPE` — e.g. `NullPointerException`
- `EXCEPTION_MESSAGE` — exception detail string
- `SHORT_CLASS` — the class where the throw occurred (last segment, no package)
- `FULL_CLASS` — full qualified name if visible in the stack trace (else null)
- `LINE_NUMBER` — approximate line (else null)
- `STACK_TRACE_EXTRACT` — up to 500 chars of the raw stack

If the user's message is ambiguous (no class name extractable), ask once:

```
AskUserQuestion("What is the exception class and line where the error occurs?
Paste the stack trace or provide: ClassName:lineNumber")
```

Do not proceed until at least `SHORT_CLASS` and `EXCEPTION_TYPE` are known.

---

## Step 2 — Resolve IA tooling + graph

### 2.1 Resolve CLI

```bash
IA_INSTALL_DIR="$HOME/.impact-analyser/cli"
if command -v ia >/dev/null 2>&1; then
  IA_CMD="ia"
elif [ -f "$IA_INSTALL_DIR/index.js" ]; then
  IA_CMD="node $IA_INSTALL_DIR/index.js"   # already installed from a previous run
else
  echo "📥 Installing ia CLI from adobe-aem-forms/impact-analyser..."
  _OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  _ARCH=$(uname -m)
  case "$_ARCH" in arm64|aarch64) _ARCH_TAG="arm64" ;; *) _ARCH_TAG="x64" ;; esac
  case "$_OS" in darwin) _OS_TAG="darwin" ;; *) _OS_TAG="linux" ;; esac
  mkdir -p "$HOME/.impact-analyser"
  gh release download \
    --repo adobe-aem-forms/impact-analyser \
    --pattern "impact-analyser-cli-${_OS_TAG}-${_ARCH_TAG}.tar.gz" \
    --dir /tmp --clobber 2>/tmp/ia-install-stderr.txt \
  && tar -xzf "/tmp/impact-analyser-cli-${_OS_TAG}-${_ARCH_TAG}.tar.gz" \
           -C "$HOME/.impact-analyser" \
  && IA_CMD="node $IA_INSTALL_DIR/index.js" \
  || { IA_CMD_MISSING=1
       IA_UNAVAILABLE="ia CLI install failed: $(head -2 /tmp/ia-install-stderr.txt)"; }
fi
```

### 2.2 Locate or download the graph

The graph is published as a nightly Release asset — downloading it is always faster than building.

```bash
GRAPH_CACHE_DIR="$HOME/.impact-analyser"
GRAPH_CACHE="$GRAPH_CACHE_DIR/impact-graph.sqlite"

# Search for an existing graph in common locations first
IA_GRAPH=$(find "$PWD" "$HOME" "$GRAPH_CACHE_DIR" /tmp \
  -name "impact-graph.sqlite" -maxdepth 6 2>/dev/null | head -1)

if [ -z "$IA_GRAPH" ]; then
  echo "📥 No local graph found — downloading pre-built graph from adobe-aem-forms/impact-analyser-graph..."
  mkdir -p "$GRAPH_CACHE_DIR"
  gh release download impact-graph-hdfc \
    --repo adobe-aem-forms/impact-analyser-graph \
    --pattern impact-graph.sqlite \
    --dir "$GRAPH_CACHE_DIR" \
    --clobber 2>/tmp/ia-graph-download-stderr.txt

  if [ -f "$GRAPH_CACHE" ]; then
    IA_GRAPH="$GRAPH_CACHE"
    echo "✅ Graph downloaded → $GRAPH_CACHE"
  else
    IA_GRAPH_MISSING=1
    echo "⚠️  Graph download failed: $(cat /tmp/ia-graph-download-stderr.txt | head -3)"
    echo "   Falling back to package-prefix matching."
  fi
fi
```

### 2.3 Resolve config (optional — for ia analyse in Step 10)

```bash
IA_CONFIG=$(find "$PWD" -maxdepth 3 \
  \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
  2>/dev/null | head -1)
```

### 2.4 Print status block

Always print — never silently skip:

```
IA status:
  CLI   : ✅ found  (or ❌ not found)
  Graph : ✅ <path> (or ❌ download failed — triage unavailable)
  Config: ✅ <path> (or ⚠️  not found — analyse will run concept-only)
```

If `IA_CMD_MISSING`: set `IA_UNAVAILABLE="ia CLI not found"` and go to Step 3.2.
If `IA_GRAPH_MISSING`: set `IA_UNAVAILABLE="graph unavailable"` and go to Step 3.2.

---

## Step 3 — Map error to repo + file

### 3.1 Run ia triage (only when both CLI and graph are available)

```bash
cat > /tmp/ia-journey-triage-input.txt <<EOF
${EXCEPTION_TYPE}: ${EXCEPTION_MESSAGE}
  at ${FULL_CLASS:-$SHORT_CLASS}(${SHORT_CLASS}.java:${LINE_NUMBER:-?})
EOF

eval $IA_CMD triage \
  --graph "$IA_GRAPH" \
  --stack-trace /tmp/ia-journey-triage-input.txt \
  --format json \
  > /tmp/ia-journey-triage.json 2>/tmp/ia-journey-triage-stderr.txt
```

Parse the triage JSON to extract:
- `IA_REPO` — the repo name that owns the error node
- `IA_FILE` — the relative file path within that repo (if present)
- `IA_TRAIL` — the graph trail string (for embedding in PR body)

If triage exits non-zero or produces no output: set `IA_TRIAGE_FAILED=1` and fall through to 3.2.

### 3.2 Fallback: repos.md match → auto-clone if needed

Used when `IA_CMD_MISSING`, `IA_GRAPH_MISSING`, or `IA_TRIAGE_FAILED`.

**3.2.1 — repos.md lookup**

Read `knowledge/repos.md`. Match `FULL_CLASS` (or `SHORT_CLASS`) against `java_package_prefix`.

If a row matches and `local_clone_path` is a valid git repo:
```bash
git -C "<local_clone_path>" rev-parse --is-inside-work-tree >/dev/null 2>&1
```
→ set `TARGET_REPO_PATH=<local_clone_path>` and skip to Step 4.3.

If a row matches but `local_clone_path` is missing/invalid AND `git_url` is set → auto-clone (3.2.2).

**3.2.2 — No match: ask for git URL, then auto-clone**

If no repos.md row matches, ask **one** question:

```
AskUserQuestion:
  Could not locate the repo for `<SHORT_CLASS>` (package: `<package>`).
  Please provide the git URL (SSH or HTTPS) and base branch.

  Examples:
    git@github.com:hdfc/forms-core.git  main
    https://github.com/hdfc/forms-core  develop
```

Parse the answer into `GIT_URL` and `BASE_BRANCH`.

**3.2.3 — Auto-clone**

Clone into a standard location and validate:

```bash
CLONE_DIR="$HOME/auto-fix-journey-clones/$(basename "$GIT_URL" .git)"
mkdir -p "$HOME/auto-fix-journey-clones"

if [ -d "$CLONE_DIR/.git" ]; then
  echo "📂 Repo already cloned at $CLONE_DIR — pulling latest"
  git -C "$CLONE_DIR" pull origin "$BASE_BRANCH"
else
  echo "📥 Cloning $GIT_URL → $CLONE_DIR"
  git clone --depth 50 "$GIT_URL" "$CLONE_DIR"
fi

git -C "$CLONE_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || { echo "ABORT: clone failed for $GIT_URL"; exit 1; }

TARGET_REPO_PATH="$CLONE_DIR"
```

Append a new row to `knowledge/repos.md`:
```
| `<package_prefix>` | `<GIT_URL>` | `<CLONE_DIR>` | `<BASE_BRANCH>` |
```

Print: `✅ Cloned <repo-name> → $CLONE_DIR`

---

## Step 4 — Resolve target repo path

By the time Step 4 runs, `TARGET_REPO_PATH` is already set (from triage, repos.md match, or auto-clone in 3.2). This step only needs to handle the IA triage case where a different repo was identified.

### 4.1 Check working repo vs IA-identified repo

```bash
WORKING_REPO=$(basename "$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null)")
```

If `IA_REPO` is set and differs from `WORKING_REPO`:
- Check if a sibling directory `$(dirname "$PWD")/$IA_REPO` exists as a valid git repo → use it.
- Otherwise: ask for `GIT_URL` and auto-clone via the same 3.2.3 recipe above.

If `IA_REPO` matches `WORKING_REPO` or is not set: `TARGET_REPO_PATH=$(git -C "$PWD" rev-parse --show-toplevel)`.

### 4.2 Resolve BASE_BRANCH

```bash
BASE_BRANCH=$(git -C "$TARGET_REPO_PATH" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null \
              | sed 's|refs/remotes/origin/||' \
              || git -C "$TARGET_REPO_PATH" rev-parse --abbrev-ref HEAD)
```

If still ambiguous, ask the user once.

---

## Step 5 — Locate source file

```bash
find "$TARGET_REPO_PATH" -name "${SHORT_CLASS}.java" -not -path "*/test/*"
```

- **Zero matches**: report "Source file not found" and ask the user for the path before proceeding.
- **Multiple matches**: ask the user which to use.
- **One match**: use it. Set `SOURCE_FILE`.

If `IA_FILE` was provided by triage and resolves to an existing file: use that directly (skip the `find`).

Read the file and locate the method at or near `LINE_NUMBER`.

---

## Step 6 — Classify fix + confidence gate

Read `knowledge/fix-classifier.md`. Apply the decision flowchart using the exception context.

### 6.1 Classify

| Fix type | Meaning |
|---|---|
| `structural` | Deterministic null/cast/bounds/lifecycle error — fix is unambiguous from source alone |
| `logic` | Outcome depends on runtime values not visible in the stack trace |
| `framework` | OSGi/CRX/FDM config issue — no code edit needed |

### 6.2 Confidence gate — ask before fixing if uncertain

**Do NOT proceed to Step 7 automatically.** First assess whether you have enough information to generate a correct, non-speculative fix. Ask yourself:

- Do you know the exact throw site and why it throws from the source alone?
- Is the fix deterministic — i.e. the same fix would be right regardless of runtime values?
- Is there any ambiguity about WHICH of several possible root causes is actually firing?

If the answer to any of these is "no" or "not sure", **stop and ask the user for the missing data points** before spawning a sub-agent. Be specific — name exactly what you need:

```
I've read the source at <file>:<line>. Before generating a fix I need a few more data points:

1. <specific question — e.g. "What does baaSConfigService.allowedJourneyStateForClients() return for SAVINGS? Check /system/console/components/...">
2. <specific question — e.g. "What clientId does the BaaS API return in sessionContext for SAVINGS OTP flows?">

Once you share these I can generate a targeted fix rather than a speculative one.
```

**Only proceed to Step 7 when confident.** A well-targeted question now is better than a wrong patch and a revert later.

### 6.3 Display classification

Always print before proceeding or asking:

```
Fix classification — <SHORT_CLASS>
Exception : <EXCEPTION_TYPE>: <EXCEPTION_MESSAGE (80 chars)>
Fix type  : structural | logic | framework
Confidence: high → proceeding to fix
            low  → asking for data points (see below)
```

---

## Step 7 — Spawn Java fix sub-agent

Read `tools/sub-agent-prompt-java.md`. Substitute all `__PLACEHOLDERS__`:

| Placeholder | Value |
|---|---|
| `__SHORT_CLASS__` | `SHORT_CLASS` |
| `__FULL_CLASS__` | `FULL_CLASS` (or `SHORT_CLASS` if unknown) |
| `__EXCEPTION_TYPE__` | `EXCEPTION_TYPE` |
| `__EXCEPTION_MESSAGE__` | `EXCEPTION_MESSAGE` |
| `__STACK_TRACE__` | `STACK_TRACE_EXTRACT` |
| `__JOURNEY_CONTEXT__` | IA trail or "not available" |
| `__FIX_TYPE__` | `structural` / `logic` |
| `__API_ERROR_CODE__` | error code if present, else "none" |
| `__FILE_PATH__` | `SOURCE_FILE` (absolute) |
| `__LINE_NUMBER__` | `LINE_NUMBER` or "unknown" |

Spawn one Agent per error. Multiple errors in different files → parallel. Same file → sequential (re-read file between sub-agents).

---

## Step 8 — Apply patches

For each `need_more_info` result: **stop, relay `what_i_know` and `questions` to the user, and wait.** Do not proceed to the next error or to Step 9 until the user answers. Once answered, re-spawn the sub-agent with the additional context appended to its prompt.

For each non-`needs_review`, non-`need_more_info` result:

```
Read(<SOURCE_FILE>)              # fresh read
verify old_string appears EXACTLY ONCE
Edit(<SOURCE_FILE>, old_string, new_string)
```

Print each patch as a diff (informational — no confirmation prompt):

```
File: <SOURCE_FILE>
- <old_string>
+ <new_string>
Reason: <explanation>
```

If `old_string` is not unique: expand context around the target line and re-spawn the sub-agent once.

`framework` and `logic/needs_review` entries: display the recommendation / checklist. No file edit.

---

## Step 9 — Branch, commit, push

```bash
FIX_BRANCH="fix/auto-fix-journey-<short_class_slug>-$(date +%Y%m%d)"

git -C "$TARGET_REPO_PATH" checkout "$BASE_BRANCH"
git -C "$TARGET_REPO_PATH" pull origin "$BASE_BRANCH"
git -C "$TARGET_REPO_PATH" checkout -b "$FIX_BRANCH"

# Verify branch before commit
CURRENT=$(git -C "$TARGET_REPO_PATH" rev-parse --abbrev-ref HEAD)
[[ "$CURRENT" == fix/auto-fix-* ]] || { echo "ABORT: HEAD is $CURRENT"; exit 1; }

# Stage only orchestrator-tracked files
git -C "$TARGET_REPO_PATH" add -- <changed files>

git -C "$TARGET_REPO_PATH" commit -m "fix: auto-fix <N> backend errors in AEM Forms journey

Errors fixed:
<one bullet per patch: ClassName:line — explanation>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

git -C "$TARGET_REPO_PATH" push origin "$FIX_BRANCH"
```

Never `git add -A` / `git add .` — only orchestrator-tracked files.

---

## Step 10 — Run impact analysis on the committed diff

Runs `ia analyse` on the diff between `HEAD~1` and `HEAD` (the fix commit). This produces the blast-radius report for the PR reviewer.

```bash
if [ -z "$IA_UNAVAILABLE" ]; then
  # --config is optional; include it only if found
  IA_CONFIG=$(find "$TARGET_REPO_PATH" -maxdepth 3 \
    \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
    2>/dev/null | head -1)
  [ -z "$IA_CONFIG" ] && IA_CONFIG=$(find "$PWD" -maxdepth 3 \
    \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
    2>/dev/null | head -1)
  IA_CONFIG_FLAG=""; [ -n "$IA_CONFIG" ] && IA_CONFIG_FLAG="--config \"$IA_CONFIG\""

  # --graph is optional; without it D1+D3 are empty, D2 (concept match) still fires
  IA_GRAPH=$(find "$TARGET_REPO_PATH" -maxdepth 3 -name "impact-graph.sqlite" 2>/dev/null | head -1)
  [ -z "$IA_GRAPH" ] && IA_GRAPH=$(find "$HOME/.impact-analyser" -name "impact-graph.sqlite" 2>/dev/null | head -1)
  IA_GRAPH_FLAG=""; [ -n "$IA_GRAPH" ] && IA_GRAPH_FLAG="--graph \"$IA_GRAPH\""
  # --concept-only suppresses the missing-graph warning cleanly
  IA_CONCEPT_ONLY=""; [ -z "$IA_GRAPH" ] && IA_CONCEPT_ONLY="--concept-only"
fi

if [ -z "$IA_UNAVAILABLE" ]; then
  git -C "$TARGET_REPO_PATH" diff HEAD~1 HEAD --name-only \
    | while IFS= read -r f; do echo "$TARGET_REPO_PATH/$f"; done \
    > /tmp/ia-journey-diff.txt

  eval $IA_CMD analyse \
    $IA_CONFIG_FLAG \
    --diff   /tmp/ia-journey-diff.txt \
    $IA_GRAPH_FLAG $IA_CONCEPT_ONLY \
    --format json \
    > /tmp/ia-journey-output.json 2>/tmp/ia-journey-stderr.txt

  if [ $? -eq 0 ] && [ -s /tmp/ia-journey-output.json ]; then
    node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync('/tmp/ia-journey-output.json', 'utf8'));
        require('fs').writeFileSync('/tmp/ia-journey-report.md', d.markdown || '');
      } catch(e) { process.exit(1); }
    " 2>/dev/null || cp /tmp/ia-journey-output.json /tmp/ia-journey-report.md
    IA_OUTPUT=$(cat /tmp/ia-journey-report.md)
    echo "✅ Impact analysis complete"
  else
    IA_UNAVAILABLE="ia exited with error — $(head -5 /tmp/ia-journey-stderr.txt)"
    echo "⚠️  Impact analysis skipped: $IA_UNAVAILABLE"
  fi
fi

[ -z "$IA_OUTPUT" ] && \
  IA_OUTPUT="<!-- Impact analysis unavailable: ${IA_UNAVAILABLE:-not run}. Run \`ia analyse\` manually before merging. -->"
```

---

## Step 11 — Raise PR

```bash
ORG_REPO=$(gh repo view "$TARGET_REPO_PATH" --json nameWithOwner -q .nameWithOwner 2>/dev/null \
           || git -C "$TARGET_REPO_PATH" remote get-url origin \
              | sed -E 's#(git@|https://)github.com[:/]##; s#\.git$##')

gh pr create \
  --repo "$ORG_REPO" \
  --base "$BASE_BRANCH" \
  --head "$FIX_BRANCH" \
  --title "fix: auto-fix <N> AEM Forms journey errors — <SHORT_CLASS_SLUG>" \
  --body "..."
```

PR body sections, in order:

1. **Error context** — exception type, message, stack trace extract, source class:line, IA triage trail (or "IA unavailable — matched via repos.md").
2. **Errors fixed** — table: class, exception, fix type, explanation. Structural fixes only.
3. **Flagged for manual review** — logic-type errors: class, analysis, manual test checklist.
4. **Framework recommendations** — config-type errors: class, recommendation, CRX/FDM path.
5. **Impact Analysis** — full `IA_OUTPUT` embedded verbatim (blast-radius summary, D1 code-impact cross-repo consumers, D2 concepts touched, D3 forms/journeys to validate and redeploy). When `IA_UNAVAILABLE`, renders: `> ⚠️ Impact analysis unavailable — <reason>. Run \`ia analyse\` manually before merging.`
6. **Test plan** — checklist focused on the journeys and forms identified in IA D3 output.

Return the PR URL. If `gh` is not installed, print the compare URL:
`https://github.com/$ORG_REPO/compare/$BASE_BRANCH...$FIX_BRANCH`

---

# API ERROR MODE

Enter this mode when the user provides an API path/route and says it is returning 400/500 errors — without providing a stack trace or class name. The goal is: query Splunk to find what's actually throwing, then hand off to Fix mode if a root cause is clear.

## Step E0 — Parse API path and gather inputs

Extract from the user's message:
- `API_PATH` — the route or partial path (e.g. `/baas/getCustomerStatus`, `/api/v1/otp/validate`)
- `HTTP_STATUS` — 400, 500, or both (if mentioned)
- `HOST_FILTER` — default `hdfc-prod-pub*` unless user specifies

Ask in one `AskUserQuestion` only if `API_PATH` is not extractable:
```
What is the API path that is failing, and which environment? (e.g. /baas/getCustomerStatus on prod)
```

## Step E1 — Check Splunk credentials

Same as Step S1 — check `SPLUNK_PASS`, ask once if missing.

## Step E2 — Query Splunk (1 day first, expand to 2 if sparse)

Read `tools/spl-mode-e.spl`. Substitute:
- `__HOST__` → host filter
- `__API_PATH__` → the extracted API path
- `__HOURS__` → `24`

Write to `/tmp/fji_api_error.py` using `tools/splunk-runner.py` as the runner. Run:

```bash
SPLUNK_PASS="<pass>" python3 /tmp/fji_api_error.py 2>/dev/null
```

**If total `occurrences` across all rows < 5:** re-run with `__HOURS__=48`. Print:
```
⚠️  Only <N> errors found in last 24h — expanding to 48h.
```

**If still < 5 after 48h:** report to user:
```
Very few errors found for <API_PATH> in the last 48h (<N> occurrences).
This may be a sporadic issue or the API path in the logs differs from what you provided.
Showing what was found — do you want to proceed or provide a different path?
```
Wait for user input before continuing.

## Step E3 — Display findings

Show results as a ranked table:

```
API Error Analysis — <API_PATH> — last <HOURS>h on <HOST>
Total error occurrences: <N>

#  | Class                           | Error summary                        | Count | Last seen
---|----------------------------------|--------------------------------------|-------|----------
1  | BaaSCustomerDetailsServiceImpl  | ServiceException: Journey state mis… |   142 | 2026-05-12 09:14
2  | OTPValidationServlet            | NullPointerException at line 631     |    38 | 2026-05-12 08:50
```

Below the table, add a short analysis paragraph:
- Which class is the dominant thrower?
- Is there a clear exception type and message?
- Is a stack trace visible in the sample data (sample `journey_id` found)?
- State whether you have enough to proceed to Fix mode or need more data

## Step E4 — Confidence check → Fix mode or ask

**If a single class+exception dominates (> 60% of occurrences) AND the exception type is recognisable (NPE, ServiceException, ClassCastException):**

→ Proceed automatically. Extract:
- `EXCEPTION_TYPE` from the `error_summary` field
- `EXCEPTION_MESSAGE` from the `error_summary` field
- `SHORT_CLASS` from `short_class`
- `LINE_NUMBER` from the error message if present

Print:
```
Root cause is clear — transitioning to Fix mode.
Class     : <SHORT_CLASS>
Exception : <EXCEPTION_TYPE>: <EXCEPTION_MESSAGE>
→ Continuing from Fix mode Step 2 (IA triage)
```

**Continue from Fix mode Step 2** with the extracted context. Everything from IA triage onward is identical.

---

**If results are scattered across multiple classes with no dominant thrower, OR the exception type is ambiguous:**

→ Do NOT proceed to Fix mode. Present findings and ask:

```
Found <N> distinct error patterns for <API_PATH>. No single root cause dominates.

Here's what I see:
[table]

To proceed I need one of:
1. A stack trace or journey ID to narrow down the exact throw site
2. Confirmation of which error (#N) you want to fix
3. More context about when the 500s started (recent deploy? config change?)
```

Wait for user input. Once they clarify, extract the error context and continue from Fix mode Step 2.

---

# SPLUNK MODE

Only enter this mode when the user explicitly asks to query logs, view errors, trace a journey, or analyse FDM API performance. Do not call Splunk in Fix mode.

## Step S0 — Detect sub-mode and gather inputs

Detect from the user's message:
- Contains "analytics", "FDM", "API performance", "failure rate", "latency", "call volume" → **Mode D**
- Contains a journey ID (UUID pattern) → **Mode C** (journey trace)
- Contains "INFO" → **Mode B** (INFO failure analysis)
- Otherwise → **Mode A** (ERROR aggregation)

Ask all inputs at once in a single `AskUserQuestion`:

**Modes A/B/C:**
```
1. Journey ID to trace (leave blank for aggregated view):
2. Log type: ERROR / INFO / both  [default: ERROR]
3. Splunk host filter  [default: hdfc-prod-pub*]
4. Look-back: 1 day or 2 days  [default: 1]
```

**Mode D:**
```
1. Date range — start date (YYYY-MM-DD) or leave blank for "last N days":
2. Date range — end date (YYYY-MM-DD) or leave blank:
3. Days to look back if no dates given [default: 1]:
4. Splunk host filter  [default: hdfc-prod-pub*]
5. Splunk index  [default: ams_cq]
6. Max API routes to show (1-100, leave blank for all):
```

## Step S1 — Check credentials

```bash
[ -n "$SPLUNK_PASS" ] && echo "found" || echo "missing"
```

If missing: `AskUserQuestion("Enter SPLUNK_PASS (will not be stored):")`.

`SPLUNK_HOST` defaults to `splunk-api.or1.adobe.net`, `SPLUNK_USER` defaults to `api_aem_forms`.

## Step S2 — Build and run query

For Modes A/B/C: read `tools/splunk-runner.py`, substitute `__SPL__` and `__HOURS__`, write to `/tmp/fji_query.py`, run:
```bash
SPLUNK_PASS="<pass>" python3 /tmp/fji_query.py 2>/dev/null
```

For Mode D: read `tools/splunk-runner-analytics.py`, substitute `__SPL__`, `__DAYS__`, `__START_DATE__`, `__END_DATE__`, write to `/tmp/fji_analytics.py`, run.

SPL file selection:

| Mode | SPL file | Key placeholders |
|------|-----------|-----------------|
| A | `spl-mode-a.spl` | `__HOST__` |
| B | `spl-mode-b.spl` | `__HOST__` |
| C | `spl-mode-c.spl` | `__HOST__`, `__JOURNEY_ID__`, `__LEVEL_FILTER__` |
| D | `spl-mode-d.spl` | `__INDEX__`, `__HOST__`, `__HEAD__` |

`__LEVEL_FILTER__` for Mode C: `"*ERROR*"` / `"*INFO*"` / omit for both.

## Step S3 — Display results

Follow the display formats in `knowledge/error-categories.md` (Modes A/B) and the journey trace / Mode D formats from the previous version of this skill. After display, offer drill-deeper.

## Step S4 — Drill deeper (on user request)

When user says "drill deeper into #N": run three parallel SPL queries (`spl-drill-d1/d2/d3.spl`) substituting `__HOST__` and `__SHORT_CLASS__`. Show volume trend → host breakdown → sample journey IDs → root cause narrative → recommended action.

## Step S5 — Transition to Fix mode (on user request)

When the user says "fix #N", "fix all structural", or "fix all" after viewing Splunk results:

1. Extract `SHORT_CLASS`, `EXCEPTION_TYPE`, `EXCEPTION_MESSAGE`, `LINE_NUMBER` from the Splunk results.
2. If no sample journey ID available yet: run `spl-journey-stack.spl` + `spl-journey-info-context.spl` in parallel to get the full exception context. Extract stack trace extract and journey flow.
3. **Continue from Fix mode Step 2** (IA triage) with the extracted error context. The Splunk results replace the user-provided error text; everything from Step 2 onward is identical.

---

# Error Handling

| Situation | Action |
|-----------|--------|
| No class name extractable from user message | Ask once before proceeding |
| `ia triage` exits non-zero or empty output | Set `IA_TRIAGE_FAILED`; fall back to repos.md matching |
| `ia` CLI not found | Set `IA_UNAVAILABLE`; fall back to repos.md; PR shows callout to run manually |
| No `impact-graph.sqlite` found | Skip triage (triage requires `--graph`); use repos.md fallback; run `ia analyse --concept-only` in Step 10 (D2 concept matching still fires) |
| No `impact-analyzer.config.yaml` found | Omit `--config` flag from `ia analyse` — config is optional; D1/D2/D3 still run against the graph if present |
| IA identifies a different repo and no local clone found | Check sibling dirs; if not found ask for git URL → auto-clone to `~/auto-fix-journey-clones/<repo>` |
| Auto-clone fails (bad URL, auth error, network) | Print error; ask user to clone manually and provide path; on second failure → `needs_review` |
| repos.md row has git_url but invalid local_clone_path | Auto-clone using git_url to `~/auto-fix-journey-clones/<repo>`; update repos.md entry |
| Source file not found by `find` | Report "not found"; ask for path before proceeding |
| Multiple `.java` files match | Ask user which to use |
| `old_string` not unique | Expand context; re-spawn sub-agent once; if still not unique → `needs_review` |
| `ia analyse` exits non-zero in Step 10 | Log stderr; set `IA_UNAVAILABLE`; continue to Step 11 |
| `git push` fails | Print push command; continue to Step 11 with `needs_review += "branch not pushed"` |
| `gh` not installed | Print GitHub compare URL instead of PR URL |
| Splunk `ConnectionRefusedError` | "Cannot reach Splunk — check VPN. Host: `splunk-api.or1.adobe.net`" |
| Splunk empty results | "No logs found — try a wider time range or different host filter." |
| `ModuleNotFoundError: splunklib` | "Run `pip install splunk-sdk`" |
| API path not found in logs (Mode E) | Retry with 48h; if still empty ask user to confirm path format as it appears in logs |
| Mode E — multiple scattered classes, no dominant thrower | Do not auto-proceed; present table and ask user to select or provide more context |
| Mode E — < 5 total errors after 48h | Report to user; ask whether to proceed or provide a different path |

---

# Example invocations

**Fix mode (default):**
```
Fix this: NullPointerException at JourneyHelperServiceImpl.java:142
```
```
Getting NullPointerException in JourneyHelperServiceImpl — Can't invoke method getStatus() because response is null
```
```
Fix this stack trace:
com.hdfc.journey.JourneyHelperServiceImpl.prepareMetaData(JourneyHelperServiceImpl.java:142)
java.lang.NullPointerException: Cannot invoke method getStatus()
```

**Splunk mode (explicit):**
```
Show errors from last 1 day
Trace journey 1404062c-f3ac-48d0-8ff8-832d64a16f01 — what failed?
Which FDM APIs have the highest failure rate?
drill deeper into #1
fix #1
fix all structural errors
```
