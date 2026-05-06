---
name: auto-fix-journey
description: Queries Splunk for AEM Forms journey logs and errors, analyzes root causes, presents structured findings with actionable recommendations, and fixes backend Java errors in customer code. Supports aggregated ERROR/INFO analysis, per-journey traces, FDM API analytics, and end-to-end Java fix generation with PR creation. Use when the user asks about AEM Forms errors, Splunk logs, journey traces, API failure rates, FDM performance, or asks to fix backend Java errors in AEM Forms.
compatibility: Requires Python 3 with splunk-sdk installed (`pip install splunk-sdk`). SPLUNK_PASS must be provided via env var or entered when prompted. Git + gh CLI required for fix branch and PR creation (Steps 5-8).
allowed-tools: Read Write Edit Bash Agent AskUserQuestion
user_invocable: true
metadata:
  author: adobe-forms
  domain: forms-debugging
---

# Journey Insights Query

## Tool files

```
tools/
├── splunk-runner.py              — Modes A/B/C runner (substitute __SPL__, __HOURS__)
├── splunk-runner-analytics.py    — Mode D runner (substitute __SPL__, __DAYS__, __START_DATE__, __END_DATE__)
├── spl-mode-a.spl                — Mode A: ERROR aggregation (placeholders: __HOST__)
├── spl-mode-b.spl                — Mode B: INFO failure analysis (placeholders: __HOST__)
├── spl-mode-c.spl                — Mode C: Journey trace (placeholders: __HOST__, __JOURNEY_ID__, __LEVEL_FILTER__)
├── spl-mode-d.spl                — Mode D: FDM API Analytics (placeholders: __INDEX__, __HOST__, __HEAD__)
├── spl-drill-d1.spl              — Drill: Volume by hour (placeholders: __HOST__, __SHORT_CLASS__)
├── spl-drill-d2.spl              — Drill: Distribution by host (placeholders: __HOST__, __SHORT_CLASS__)
├── spl-drill-d3.spl              — Drill: Sample journey IDs (placeholders: __HOST__, __SHORT_CLASS__)
├── spl-journey-stack.spl         — Fix: Full exception stack for class+journey (placeholders: __HOST__, __SHORT_CLASS__, __JOURNEY_ID__)
├── spl-journey-info-context.spl  — Fix: Non-PII INFO+ERROR context for a journey (placeholders: __HOST__, __JOURNEY_ID__)
└── sub-agent-prompt-java.md      — Fix: Java fix sub-agent prompt template (Steps 5-8)
```

## Knowledge

```
knowledge/
├── error-categories.md  — Named category patterns and analyst-narrative output format spec
├── fix-classifier.md    — Structural / Logic / Framework fix classification rules
└── repos.md             — Package-prefix → git repo manifest (fill in once per project)
```

---

Queries Splunk directly via splunklib. Five modes depending on what the user provides:

| journeyId | Log type | Mode |
|-----------|----------|------|
| Not provided | ERROR | Aggregated ERROR summary — top recurring errors grouped into named categories |
| Not provided | INFO | INFO failure analysis — non-zero error codes grouped by class |
| Provided | ERROR | Journey trace filtered to `*ERROR*` entries only |
| Provided | INFO or both | Full journey trace — all log levels, sorted by time |
| "analytics" keyword | — | FDM API Analytics — call volume, failure rate, latency per API route |

---

## Step 0 — Gather inputs

Detect mode from the user's message first:
- Contains "analytics", "FDM", "API performance", "failure rate", "latency", "call volume" → **Mode D** (skip to Step 0D)
- Otherwise → ask the standard questions below

Ask all at once in a single `AskUserQuestion`:

```
1. Journey ID to trace (leave blank for aggregated view):
2. Log type: ERROR / INFO / both  [default: ERROR]
3. Splunk host filter  [default: hdfc-prod-pub*]
4. Look-back: 1 day or 2 days  [default: 1]
```

Parse answers:
- Empty journey ID → aggregated mode
- Log type `both` → no level filter in the SPL
- DAYS from "1" or "2", default 1 → `HOURS = DAYS * 24`

### Step 0D — Analytics mode inputs

Ask all at once in a single `AskUserQuestion`:

```
1. Date range — start date (YYYY-MM-DD) or leave blank for "last N days":
2. Date range — end date (YYYY-MM-DD) or leave blank:
3. Days to look back if no dates given [default: 1]:
4. Splunk host filter  [default: hdfc-prod-pub*]
5. Splunk index  [default: ams_cq]
6. Max API routes to show (1-100, leave blank for all):
```

---

## Step 1 — Check credentials

Check if `SPLUNK_PASS` is set in the environment:

```bash
[ -n "$SPLUNK_PASS" ] && echo "found" || echo "missing"
```

If missing, `AskUserQuestion("Enter SPLUNK_PASS (will not be stored):")` and set it as an env-var in the run command.

`SPLUNK_HOST` defaults to `splunk-api.or1.adobe.net`, `SPLUNK_USER` defaults to `api_aem_forms` — override via env vars if needed.

### Resolve IA tooling

Resolve now so Step 8.3.5 can use it without re-checking:

```bash
if command -v ia >/dev/null 2>&1; then
  IA_CMD="ia"
elif [ -f "/Users/subodhj/Desktop/workspace/impact-analyser/impact-analyser/src/cli.js" ]; then
  IA_CMD="node /Users/subodhj/Desktop/workspace/impact-analyser/impact-analyser/src/cli.js"
else
  IA_UNAVAILABLE="ia CLI not found"
fi
```

`IA_CONFIG` and `IA_GRAPH` are resolved per target repo in Step 8.3.5 once the repo path is known.

---

## Step 2 — Write and run the query script

For **Modes A/B/C**: read `tools/splunk-runner.py`, substitute `__SPL__` and `__HOURS__`, write to `/tmp/fji_query.py`.
For **Mode D**: read `tools/splunk-runner-analytics.py`, substitute `__SPL__`, `__DAYS__`, `__START_DATE__`, `__END_DATE__`, write to `/tmp/fji_analytics.py`.

Then run:

```bash
SPLUNK_PASS="<pass>" python3 /tmp/fji_query.py 2>/dev/null
```

**SPL selection:**

| Mode | Tool file | Key placeholders |
|------|-----------|-----------------|
| A — ERROR aggregation | `tools/spl-mode-a.spl` | `__HOST__` |
| B — INFO failure | `tools/spl-mode-b.spl` | `__HOST__` |
| C — Journey trace | `tools/spl-mode-c.spl` | `__HOST__`, `__JOURNEY_ID__`, `__LEVEL_FILTER__` |
| D — FDM Analytics | `tools/spl-mode-d.spl` | `__INDEX__`, `__HOST__`, `__HEAD__` |

Read the appropriate `.spl` file, substitute its placeholders, then embed the result as `__SPL__` in the Python script.

**`__LEVEL_FILTER__` values for Mode C:**

| Log type | Value |
|----------|-------|
| ERROR | `"*ERROR*"` |
| INFO | `"*INFO*"` |
| both | _(omit entirely)_ |

**For drill-deeper queries** (Step 4): read `tools/spl-drill-d1.spl`, `tools/spl-drill-d2.spl`, `tools/spl-drill-d3.spl`. Write each to a separate `/tmp/fji_drill_<N>.py` and run in parallel.

---

## Step 3 — Display results

### Aggregated view (Mode A or B)

Read `knowledge/error-categories.md` for:
- Category naming rules (which `short_class` patterns map to which named categories)
- Analyst-narrative output format specification

Follow the format exactly: opening line, one numbered block per category, closing "Most actionable items" section, and drill-deeper offer.

### Journey trace display (Mode C)

```
**Journey trace — <JOURNEY_ID>**
Host: __HOST__ | Period: last __HOURS__h | Entries found: <count>

[<_time>] *<level>* <short_class>
<msg — first 200 chars>
────────────────────────────────────────
```

After the trace, add a **Claude analysis block**:
- Summarise the journey flow (which APIs were called in order)
- Identify where it failed: first ERROR entry, or first non-zero error code in INFO logs
- Extract error code and message if present: e.g. `ErrorCode: V5LO4010SH — ELIGIBLE AMOUNT IS LESS THAN EQUAL ZEROS`
- State whether the failure is in AEM code, an external HDFC API, or configuration

### Mode D display

```
**FDM API Analytics — __HOST__ | __INDEX__ | __DATE_RANGE__**
Total calls: <N> | Total failures: <F> | Overall failure rate: <R>% | Unique routes: <U>

| # | API Route | Calls | Failures | Failure Rate | Avg (ms) | Max (ms) |
|---|-----------|-------|----------|--------------|----------|----------|
| 1 | /some/api/path | 300 | 5 | 1.67% | 240.5 | 3200 |
```

After the table, add a **Summary block**:

```
**Key findings:**
- Busiest route: <route> (<N> calls)
- Highest failure rate: <route> (<R>%) — <note if > 5% = concern, > 20% = critical>
- Slowest (avg): <route> (<ms> ms avg)
- Slowest (max): <route> (<ms> ms max — note if > 5000 ms = potential timeout)

**Recommended actions:**
1. <route with highest failure rate> — "failure_rate > X% — check HDFC backend API health; verify AEM FDM data-source config in CRX under /conf/…/settings/cloudconfigs"
2. <route with max_time_ms > 5000> — "max latency spike detected — review AEM FDM timeout settings; check network path to external API"
[only include routes with failure_rate > 5% or max_time_ms > 5000; skip if none]
```

---

## Step 4 — Drill deeper (on user request)

When the user says "drill deeper into #N" or names a category:

1. Identify the `short_class` values in that category from the earlier results.
2. Read `tools/spl-drill-d1.spl`, `tools/spl-drill-d2.spl`, `tools/spl-drill-d3.spl`. Substitute `__HOST__` and `__SHORT_CLASS__` (use `"ClassA" OR "ClassB"` for multi-class categories). Write and run as three parallel Python scripts.

**Output format:**

```
**Drilling deeper into #N — <Category Name>**

**Volume trend (last __HOURS__h, 1h buckets):**
| Hour (UTC) | Errors |
|------------|--------|

*Spike/flat/declining — note if concentrated in a time window*

**By host:**
| Host | Errors |
|------|--------|

**Sample affected journey IDs:**
- <jid 1> [up to 5; "No journey IDs found" if D3 returns empty]

**Root cause analysis:**
<2-3 sentences — spike or steady-state? worst host? likely trigger>

**Recommended action:** <specific — CRX path, API endpoint, config key, or monitoring query>
```

---

## Step 5 — Get full exception context (fix flow only)

Triggered when the user says "fix #N", "fix all structural", or "fix all" after Step 4.

For each targeted error (identified by `short_class` + `error_summary` from Mode A results):

1. Get a sample journey ID from D3 drill results (already available from Step 4).
2. Run in parallel using `splunk-runner.py` with `HOURS=24`:
   - `tools/spl-journey-stack.spl` — substitute `__HOST__`, `__SHORT_CLASS__`, `__JOURNEY_ID__`; captures full exception message up to 500 chars
   - `tools/spl-journey-info-context.spl` — substitute `__HOST__`, `__JOURNEY_ID__`; captures non-PII journey flow (API codes, timing, step markers)
3. Extract from results:
   - Full exception message and any stack trace lines present in the log
   - API error codes (`err_code` field) from INFO context
   - Journey step sequence (which classes were called before the failure)
   - Approximate line number if present in the exception message

**Important — PII constraint**: INFO logs do not contain user payload (name, PAN, DOB, amount). Use only what is visible: exception type, message, class names, API error codes, and journey flow order.

Display a per-error context summary:
```
**Exception context — <short_class>**
Exception: <type>: <message (500 chars)>
Journey flow: <ClassA> → <ClassB> → <short_class> (failed)
API error code: <err_code or "none">
Fix type: <Structural / Logic / Framework>
```

---

## Step 6 — Classify fixes

Read `knowledge/fix-classifier.md`. Apply the decision flowchart to each error using the exception context from Step 5.

For each error, set `fix_type` to one of:
- `structural` — deterministic null/cast/bounds/lifecycle error; apply fix directly
- `logic` — depends on runtime payload not visible in logs; generate stub + checklist
- `framework` — OSGi/CRX/FDM config issue; return config recommendation, no code edit

Display a classification table before proceeding:

```
| # | short_class | Exception | Fix type | Action |
|---|-------------|-----------|----------|--------|
| 1 | JourneyHelperServiceImpl | NullPointerException at line 142 | structural | Apply fix |
| 2 | FormsRelationServiceImpl | errorCode: V5LO4010SH | logic | Stub + checklist |
| 3 | APIOrchestrationServiceImpl | ComponentException | framework | Config recommendation |
```

Proceed automatically — no confirmation prompt.

---

## Step 7 — Locate source file

For each `structural` or `logic` error:

1. Read `knowledge/repos.md`. Match `short_class` to a row by `java_package_prefix`.
   - If no match: ask the user for the git URL and branch (one `AskUserQuestion` covering all unmatched classes). Append new rows to `knowledge/repos.md`.
2. Resolve the local clone path. The orchestrator **never auto-clones** repos.
   - If `local_clone_path` is set in `repos.md` AND the path exists as a valid git repo (`git -C "<local_clone_path>" rev-parse --is-inside-work-tree`) → use it directly; no user prompt needed.
   - Otherwise, ask the user once per distinct unresolved repo (group all affected classes together):
     ```
     ⚠️  Source repo not found at the path in repos.md (or no path set).
     Repo    : <repo_name>  (<git_url>)
     Classes : <short_class_1>, <short_class_2>

     Do you have this repo cloned locally? Enter path (or 'skip' to flag for manual review):
     ```
   - Validate the supplied path (`git -C "<path>" rev-parse --is-inside-work-tree`); re-ask once if invalid.
   - If valid: set `local_clone_path` to the validated path for all errors in this repo; update the in-memory `repos.md` entry so later steps use it.
   - If 'skip' or second validation fails: set `fix_type = needs_review` for all errors in this repo and continue to the next repo.
3. Find the source file:
   ```bash
   find <local_clone_path> -name "<short_class>.java" -not -path "*/test/*"
   ```
   - Zero matches: report "Source file not found — provide the path manually."
   - Multiple matches: ask the user which to use.
4. Read the file and locate the method near the line from the stack trace.

---

## Step 8 — Spawn Java fix sub-agents and raise PR

### 8.1 Generate fixes

Read `tools/sub-agent-prompt-java.md`. For each error, substitute all `__PLACEHOLDERS__` from the error context and source file location, then spawn a sub-agent:

- Different repos or different files → spawn ALL in parallel
- Same file → spawn sequentially (read file between each to avoid conflicting `old_string`)

### 8.2 Handle results

- `fix_type: structural`, `needs_review: false` → apply the `old_string` → `new_string` diff with the Edit tool immediately
- `fix_type: logic`, `needs_review: true` → display `analysis` and `manual_test_checklist`; do not edit the file; include in PR description as "Flagged for manual review"
- `fix_type: framework` → display config recommendation block; no file edit

Print each fix as a diff before applying (informational — no confirmation prompt):
```
File: <file_path>
- <old_string line(s)>
+ <new_string line(s)>
Reason: <explanation>
```

### 8.3 Create fix branch, commit, push

```bash
FIX_BRANCH="fix/auto-fix-journey-<short_class_slug>-$(date +%Y%m%d)"
git -C <local_clone_path> checkout <branch>
git -C <local_clone_path> pull origin <branch>
git -C <local_clone_path> checkout -b $FIX_BRANCH
# (apply fixes with Edit tool — already done in 8.2 for structural fixes)
git -C <local_clone_path> add <changed files>
git -C <local_clone_path> commit -m "fix: <N> backend errors in AEM Forms journey
<bullet per fix: ClassName:line — explanation>
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git -C <local_clone_path> push origin $FIX_BRANCH
```

### 8.3.5 Impact analysis (best-effort — runs after commit, before PR)

Analyses what other repos, forms, and journeys are affected by the Java changes. Result is embedded in the PR body. This step is **best-effort** — if the config or CLI is missing it degrades gracefully and the PR still opens.

```bash
if [ -z "$IA_UNAVAILABLE" ]; then
  # Config — search target repo first, fall back to current working directory
  IA_CONFIG=$(find "<local_clone_path>" -maxdepth 3 \
    \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
    2>/dev/null | head -1)
  [ -z "$IA_CONFIG" ] && IA_CONFIG=$(find "$PWD" -maxdepth 3 \
    \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
    2>/dev/null | head -1)
  [ -z "$IA_CONFIG" ] && IA_UNAVAILABLE="no impact-analyzer.config.yaml found"

  # Graph DB — enables D1 code-impact + D3 journey-impact sections
  IA_GRAPH=$(find "<local_clone_path>" -maxdepth 3 -name "impact-graph.sqlite" 2>/dev/null | head -1)
  [ -z "$IA_GRAPH" ] && IA_GRAPH=$(find "$HOME/.impact-analyser" -name "impact-graph.sqlite" 2>/dev/null | head -1)
  IA_GRAPH_FLAG=""; [ -n "$IA_GRAPH" ] && IA_GRAPH_FLAG="--graph \"$IA_GRAPH\""
  [ -z "$IA_GRAPH" ] && IA_CONCEPT_ONLY="--concept-only"
fi

if [ -z "$IA_UNAVAILABLE" ]; then
  # Build diff file — one absolute path per changed Java file
  git -C "<local_clone_path>" diff HEAD~1 HEAD --name-only \
    | while IFS= read -r f; do echo "<local_clone_path>/$f"; done \
    > /tmp/ia-journey-diff.txt

  eval $IA_CMD analyse \
    --config "$IA_CONFIG" \
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
  IA_OUTPUT="<!-- Impact analysis unavailable: ${IA_UNAVAILABLE:-not run} -->"
```

### 8.4 Raise PR

```bash
gh pr create \
  --repo <org>/<repo> \
  --base <branch> \
  --head $FIX_BRANCH \
  --title "fix: auto-fix <N> AEM Forms journey errors — <short_class_slug>" \
  --body "..."
```

PR body sections, in order:

1. **Splunk context** — host, query period, mode (A/B/C), journey ID if applicable.
2. **Errors fixed** — table: class, exception, fix type, explanation (structural fixes only).
3. **Flagged for manual review** — logic-type errors: class, analysis, test checklist.
4. **Framework recommendations** — config-type errors: class, recommendation, CRX/FDM path.
5. **Impact Analysis** — full `IA_OUTPUT` embedded verbatim. Covers blast-radius summary, D1 code-impact cross-repo consumers, D2 concepts touched, D3 forms/journeys to validate. When `IA_UNAVAILABLE`, renders: `> ⚠️ Impact analysis unavailable — <reason>. Run \`ia analyse\` manually before merging.`
6. **Test plan** — checklist focused on the journeys identified in the Splunk trace and IA D3 output.

Return the PR URL. If `gh` is not installed, print the GitHub compare URL.

---

## Error Handling

| Situation | Action |
|-----------|--------|
| `ConnectionRefusedError` | "Cannot reach Splunk — check VPN. Host: `splunk-api.or1.adobe.net`" |
| `SPLUNK_PASS` empty | Ask for it via `AskUserQuestion` |
| `ModuleNotFoundError: splunklib` | "Run `pip install splunk-sdk`" |
| Empty results | "No logs found — try a wider time range or different host filter." |
| Journey trace returns no rows | "Journey ID not found in last __HOURS__h. Try 2 days or check the ID." |
| All rows have `short_class` null | "Log format not matched — paste one raw log line so I can adjust the regex." |
| No journey IDs from D3 (fix flow) | Ask the user to provide a journey ID manually for Step 5 |
| Class not in `knowledge/repos.md` | Ask for git URL + branch; append to repos.md |
| Source file not found in repo | Report "not found"; ask user for path before proceeding |
| Minified or generated `.java` file | Return `needs_review: true` with "Minified/generated — cannot auto-fix" |
| `old_string` not unique in file | Expand with more surrounding lines before retrying |
| `git push` fails | Print push command for user to run manually |
| `local_clone_path` not set or path missing | Ask user for local clone path (Step 7.2); never auto-clone |
| User-supplied repo path invalid / not a git repo | Re-ask once; if still invalid, set `needs_review` for all errors in that repo |
| User types 'skip' for a repo | Flag all errors in that repo as `needs_review`; continue with other repos |
| `ia` CLI not found at known path | Set `IA_UNAVAILABLE`; skip 8.3.5; PR section shows callout to run manually |
| No `impact-analyzer.config.yaml` in target repo or cwd | Set `IA_UNAVAILABLE`; skip analysis; PR shows callout |
| No graph DB found | Use `--concept-only`; D1 + D3 sections will be empty but D2 concept analysis still runs |
| `ia analyse` exits non-zero or empty output | Set `IA_UNAVAILABLE`; log stderr; continue to 8.4 |

---

## Example invocations

```
"Show errors from last 1 day"
"INFO analysis for last 2 days on hdfc-uat-06-*"
"Trace journey 1404062c-f3ac-48d0-8ff8-832d64a16f01 — what failed?"
"Show all logs for journey 8ed5092e-4ae8-418e-9748-46c8d591a45e from today, ERROR only"
"What are the top AEM errors today?"
"drill deeper into #1"
"drill deeper into all"

"Show API analytics for last 7 days"
"Which FDM APIs have the highest failure rate?"
"Show API performance for <start-date> to <end-date>"
"Top 10 slowest FDM API routes this week"
"API analytics on hdfc-uat-* for last 2 days"

"fix #1"
"fix all structural errors"
"fix all"
"fix the NullPointerException in JourneyHelperServiceImpl"
```
