---
name: auto-fix-form
description: End-to-end automated workflow that queries telemetry for known production URLs, uses the live-debug-form skill to navigate and diagnose a running AEM/EDS form, then generates fixes via parallel per-error sub-agents, commits them to a new fix branch, gates the branch through the performance-bot CLI (`--diff`) and auto-fixes any violations, and raises a PR against the user-supplied base branch. auto-fix-form is the orchestrator; live-debug-form does all browser interaction and diagnosis.
compatibility: Requires Chrome DevTools MCP. Works with EDS/forms-engine (window.myForm) and AEM Core Components (guideBridge) forms. Requires git + gh CLI for PR creation. Phase 3.5 requires Node 20+ and the performance-bot CLI installed at `~/.performance-bot/index.js` — the skill installs it on first run if missing.
allowed-tools: Read Write Edit Bash Glob Grep Agent Skill WebFetch AskUserQuestion mcp__chrome-devtools__evaluate_script mcp__chrome-devtools__navigate_page mcp__chrome-devtools__new_page mcp__chrome-devtools__list_pages mcp__chrome-devtools__select_page mcp__chrome-devtools__take_snapshot mcp__chrome-devtools__list_console_messages mcp__chrome-devtools__list_network_requests mcp__chrome-devtools__get_network_request
user_invocable: true
metadata:
  author: adobe-forms
  domain: forms-debugging
---

# Auto Fix Form

## Tool files

```
tools/
├── sub-agent-prompt.md       — per-error fix prompt template (Phase 2 sub-agents)
└── perf-bot-fix-prompt.md    — per-violation fix prompt template (Phase 3.5 sub-agents)
```

## Knowledge

```
knowledge/
├── fix-classification.md     — error→fix-type tables and page-level/repo-search fix strategies
└── perf-bot-violations.md    — performance-bot --diff violation→recipe table + parsing rules
```

---

## CRITICAL RULES

| # | Rule | Wrong | Right |
|---|------|-------|-------|
| 1 | **Never commit to the user's branch** | `git commit` on `uat-cards-release-test` | Create `fix/auto-fix-<slug>` FROM it, commit there |
| 2 | **PR base is always the user's branch** | `--base main` | `--base <BASE_BRANCH>` |
| 3 | **Never ask for fix confirmation** | "Apply all? yes/cancel" | Print diff, apply immediately |
| 4 | **Always ask for git URL first** | Assume local path exists | Ask for URL, clone if needed, then ask branch |
| 5 | **Never push or open the PR before the perf-bot gate runs** | `gh pr create` straight after `git commit` | Run Phase 3.5 (`--diff`), fix any violations, only then push + PR |
| 6 | **Never skip Phase 3.5 because the CLI is missing** | "perf-bot not installed — skipping" | Install the CLI inline (`mkdir -p ~/.performance-bot && curl … | tar -xz -C ~/.performance-bot`), then run it |
| 7 | **Never loop the perf-bot gate forever** | "still 1 violation, retry…" repeatedly | Cap at 3 iterations; remaining violations go in PR body under "Performance follow-ups" |

**Phase 3 branch creation (mandatory every run):**
```bash
git -C <REPO_PATH> checkout <BASE_BRANCH>
git -C <REPO_PATH> pull origin <BASE_BRANCH>
git -C <REPO_PATH> checkout -b fix/auto-fix-<form-slug>-$(date +%Y%m%d)
```

**PR creation (mandatory every run):**
```bash
gh pr create --base <BASE_BRANCH> --head fix/auto-fix-<form-slug>-$(date +%Y%m%d) ...
```

---

## Role split

```
auto-fix-form  (this skill)
│
├── /optel-query skill         (telemetry errors — Phase 0)
├── live-debug-form skill      (ALL browser + diagnostics — Phase 1)
├── per-error sub-agents       (parallel fix generation — Phase 2)
├── git                        (branch + error-fix commit — Phase 3.1–3.4)
├── performance-bot CLI        (--diff gate + per-violation sub-agents — Phase 3.5)
└── git / gh                   (push + PR — Phase 3.6–3.7)
```

`auto-fix-form` never touches the browser directly — it delegates entirely to `live-debug-form`.

---

## Two invocation modes

### Mode A — URL mode

User provides a live form URL. Flow: Phase 0 → Phase 1 → Phase 2 → Phase 3.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `FORM_URL` | Yes | Live URL of the form page |
| `ERROR` | No | Specific error to fix (file + line or message substring) |
| `REPO_PATH` | No | Local repo path — asked in Phase 3 if omitted |
| `BRANCH` | No | Base branch — asked in Phase 3 if omitted |

### Mode B — Error mode

User provides error strings directly (console, telemetry, bug report). No browser. Flow: Phase E → Phase 2 → Phase 3.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `ERRORS` | Yes | One or more error strings (any format) |
| `REPO_PATH` | No | Local repo path — defaults to `pwd` |
| `BRANCH` | No | Base branch — asked if omitted |

**Accepted formats:**
```
fdSelectHandler@https://host/path/file.js:59:11 | typeerror: fdPanel.forEach is not a function
TypeError: Cannot read properties of null (reading 'type')  at fd-dom-functions.js:227
"_satellite is not defined" in analytics.js line 79
```

### Mode detection

| What the user provides | Mode |
|------------------------|------|
| A URL | Mode A |
| Error strings, no URL | Mode B |
| URL + error strings | Mode A, pre-populate `allErrors[]`, skip Phase 0 |

---

## Prerequisites — Chrome DevTools (Mode A only)

Call `mcp__chrome-devtools__list_pages` before any browser tool call. If it errors, ask the user to restart Claude Code.

---

## Phase E — Parse & Classify Errors (Mode B only)

For each error string, extract: `type`, `message`, `fileUrl`, `file`, `line`, `col`. Set `source: "user-provided"`.

Read `knowledge/fix-classification.md` for the fix-type classification table. Apply it to each parsed error.

Display the parsed list, set `allErrors[]`, and proceed to Phase 2. If `REPO_PATH` not provided, default to `pwd` and verify with `git status`.

---

## Phase 0 — Telemetry Query (Mode A only)

Run only when `FORM_URL` is a production URL (hostname does NOT contain `aem.page`, `aem.live`, `hlx.page`, `hlx.live`, `localhost`).

### 0.1 — Invoke `/optel-query`

Run `date +%Y-%m-%d` for today's date. Use it as both `startDate` and `endDate` unless the user specifies a range.

```
Skill("optel-query", "Get all JavaScript errors for <FORM_URL> on <todayDate>.
Return: { message, file, line, count, pct_sessions_affected }. Sort by count desc.")
```

### 0.2 — Classify and deduplicate

Read `knowledge/fix-classification.md` for the telemetry classification table.

Merge entries with the same root error (same message + file, different line/casing). Sum counts.

### 0.3 — Display and wait for user selection

Show a table of fixable errors (type, message, file:line, count, fix type) and a list of skipped entries with reasons. Ask: **"Which error(s) to fix? Number, comma-separated list, or 'all':"**

Wait for user reply. Filter `telemetryErrors[]` to `selectedErrors[]`.

If `ERROR` parameter was given at invocation, pre-select and skip this prompt.
If `/optel-query` fails: print `"No telemetry data — proceeding with live diagnosis only."` and continue to Phase 1.

---

## Phase 1 — Navigate & Diagnose (Mode A only)

Invoke `Skill("live-debug-form")`. Follow its full Steps 1–4. Never call live-debug-form tool files directly.

live-debug-form will: navigate to `FORM_URL`, install `window.__getForm()`, run Diagnostic A (form overview) then Diagnostic F (script errors).

### Step-walking multi-step forms

After live-debug-form Step 2, install a **DOM MutationObserver** (not form model subscriptions — those are wiped on panel re-init) that watches `style`, `class`, `hidden`, `data-visible`, `aria-hidden` attributes on `document.documentElement`. It records each top-level panel's first visibility transition to `window.__stepLog[]` and captures global errors to `window.__capturedErrors[]`. Build `PANEL_MAP` from the actual panel IDs returned by the resolver.

Reinstall the observer after any cross-domain navigation (e.g. external KYC).

**Step-walk loop — four states:**

**STATE 1 — ACTION NEEDED** (before each wait): Read current panel fields and buttons via live-debug-form Diagnostic B + `take_snapshot`. Print a clearly formatted block showing: panel name, fields (label, type, required), primary button label. All values from the live form — never hardcoded. Include a note that the user can type "proceed" to skip remaining steps.

**STATE 2 — WAITING**: Print a one-line status immediately after STATE 1.

**STATE 3 — Poll**: Run 30-second `evaluate_script` polling windows in a loop (Chrome DevTools MCP timeout is shorter than 5 min). Each round checks `window.__stepLog.length`. After `timedOut: true`, print `⏳ Still waiting…` and start next round. After 10 consecutive timeouts (5 min total), go to STATE 4b. After `transitioned: true`, go to STATE 4a.

If the execution context is destroyed (cross-domain nav): call `list_pages`, take a snapshot, show an ACTION NEEDED block for the external page, poll `list_pages` every 30 s until back on the form domain, then reinstall the observer.

**STATE 4a — DETECTED**: Print transition info (new panel, steps done so far). Run Diagnostic F to collect errors on this step; tag each with the panel name. Loop to STATE 1 for the next panel.

**STATE 4b — PAUSED**: Print completed panels (from `window.__stepLog`) and not-reached panels (from `window.__stepMap` filtered by `__stepLog`). Compute not-reached dynamically — never hardcode. Proceed to Phase 2 with errors collected so far.

If the user types "proceed", "stop", "skip", or "next phase": stop polling immediately, print STATE 4b, and proceed to Phase 2.

### What comes back from live-debug-form

```
diagnosticResults = {
  formInfo: { formId, title, fieldCount, source },
  errors: [{ step, type, message, file, fileUrl, line, col, interpretation }],
  networkFailures: [{ url, status, step }],
  formModelErrors: [{ fieldName, error }]
}
```

### Merge telemetry + live errors

Combine `selectedErrors[]` (Phase 0) with `diagnosticResults.errors[]`:
- Deduplicate by `(file, line)` — prefer live entry (it has `interpretation`)
- Enrich live entries with `count` + `pct_sessions_affected` from telemetry matches
- Telemetry-only entries: include with `source: "telemetry-only"`, no interpretation

Final list is `allErrors[]`. If `ERROR` parameter was given at invocation, filter `allErrors` to the single matching entry (match on file + line, or message substring).

Display a summary table: form title, field count, steps reached/total, each error (type, file:line, message, count, source).

---

## Phase 2 — Generate Fixes via Sub-Agents

Spawn one sub-agent per error using the `Agent` tool.
- Different files → spawn ALL in parallel
- Same file → spawn sequentially (read file between each to avoid conflicting `old_string`)

### Sub-agent prompt

Read `tools/sub-agent-prompt.md`. Use its contents as the prompt template, substituting values from the `allErrors[]` entry.

### Page-level and repo-search fix strategies

Read `knowledge/fix-classification.md` for the grep-based strategies used for page-level errors and repo-search errors before spawning sub-agents.

### After collecting results

- `needs_review: true` → show analysis, wait for user decision
- Validate `old_string` appears exactly once — if multiple matches, expand with more surrounding lines

---

## Phase 3 — Apply Fixes, Gate, & Raise PR

**Runs automatically after Phase 2 — no pause or confirmation prompt. The performance-bot gate (3.5) is mandatory; never skip directly from 3.4 to 3.6.**

Stage order (do not reorder):

```
3.1 repo + branch  →  3.2 locate files  →  3.3 show diff  →
3.4 apply + commit error fixes  →  3.5 perf-bot --diff gate  →
3.6 push  →  3.7 PR
```

### 3.1 Get repo and branch

Use `REPO_PATH` and `BRANCH` if provided; otherwise ask both in one prompt. Then:

```bash
git clone <URL> <REPO_PATH>            # only if URL given and no local clone
git -C <REPO_PATH> checkout <BASE_BRANCH>
git -C <REPO_PATH> pull origin <BASE_BRANCH>
FIX_BRANCH="fix/auto-fix-<form-slug>-$(date +%Y%m%d)"
git -C <REPO_PATH> checkout -b $FIX_BRANCH
```

`<form-slug>` = last path segment of `FORM_URL` (Mode A), or the filename of the first error without extension (Mode B, e.g. `fddetailsutil` from `fddetailsutil.js`).

### 3.2 Locate files

```bash
find <REPO_PATH> -name "<filename>" -not -path "*/node_modules/*"
```

Multiple matches → ask user which to use. Read file to confirm `old_string` is present.

### 3.3 Show diff (informational — apply immediately, no prompt)

Print each fix as `- old / + new` with a one-line explanation, then apply.

### 3.4 Apply & commit error fixes (no push yet)

```bash
# Apply with Edit tool for each fix, then:
git -C <REPO_PATH> add <changed files>
git -C <REPO_PATH> commit -m "fix: <N> form errors on <form page name>
<bullet per fix: file:line — explanation>
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Do **not** push here. Phase 3.5 may add another commit, and pushing prematurely creates noise on the remote.

### 3.5 Performance-bot diff gate (mandatory, runs before push)

This phase blocks the PR until the local performance-bot CLI reports zero violations on the changed files (or three iterations have run). Read `knowledge/perf-bot-violations.md` for the violation→recipe table and report-parsing rules.

#### 3.5.1 Ensure CLI is installed

```bash
if [ ! -f "$HOME/.performance-bot/index.js" ]; then
  mkdir -p "$HOME/.performance-bot"
  curl -L https://github.com/adobe-aem-forms/performance-bot/releases/latest/download/performance-bot-cli.tar.gz \
    | tar -xz -C "$HOME/.performance-bot"
fi
node --version   # must be 20+; if not, print upgrade hint and skip 3.5 with a needs_review entry
```

If `node` is < 20 or the install fails (no network, 404), do **not** abort the run — record a single `needs_review` entry "performance-bot CLI unavailable: <reason>" and continue to Phase 3.6. Do **not** silently skip; the PR body must surface this so the author can run it manually.

#### 3.5.2 Run loop (max 3 iterations)

```
ITER = 1
while ITER ≤ 3:
  cd <REPO_PATH>
  rm -f .perf-bot-report.md
  node ~/.performance-bot/index.js --diff --output ./.perf-bot-report.md
  parse .perf-bot-report.md → violations[]      # see knowledge/perf-bot-violations.md
  if violations.length == 0:
    break
  if ITER == 3:
    record remaining violations as "Performance follow-ups"
    break
  spawn one Agent per violation using tools/perf-bot-fix-prompt.md
    - different files → in parallel (single message, multiple Agent calls)
    - same file      → sequential (re-read between sub-agents)
  collect (file_relative, old_string, new_string) tuples
  apply via Edit tool from orchestrator (idempotent — read-then-edit)
  ITER += 1
```

#### 3.5.3 Commit perf fixes (only if anything changed in 3.5.2)

```bash
# Move the perf-bot report out of REPO_PATH before staging so it can never
# end up in the commit, then stage only the JS/CSS/JSON files the sub-agents
# actually touched (recorded in step 3.5.2 as `changedFiles[]`).
mv <REPO_PATH>/.perf-bot-report.md <RUN_OUTPUT_DIR>/perf-bot-report-final.md 2>/dev/null || true

if ! git -C <REPO_PATH> diff --quiet -- <changedFiles[]>; then
  git -C <REPO_PATH> add <changedFiles[]>
  git -C <REPO_PATH> commit -m "perf: address performance-bot violations on <form page name>
<one bullet per violation type fixed: file:line — type>
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
fi
```

A separate commit (not `--amend`) keeps the error fix and the perf fix bisectable. **Never use `git add -A`** here — that would sweep in `.perf-bot-report.md` and any unrelated changes the user has on the working tree.

#### 3.5.4 What to capture for Phase 4 (Run Report)

For every iteration, save: the exact `node …/index.js --diff` command, the contents of `.perf-bot-report.md` (copied to `<RUN_OUTPUT_DIR>/perf-bot-report-iter<N>.md` before the next iteration overwrites it), the parsed `violations[]` table, the sub-agent prompts and JSON results, and the final commit SHA. The report file itself is **never** committed to the repo.

### 3.6 Push branch

```bash
git -C <REPO_PATH> push origin $FIX_BRANCH
```

If `git push` fails: show the push command for the user to run manually and continue to 3.7 with a `needs_review` "branch not pushed".

### 3.7 Raise PR

```bash
gh pr create \
  --repo <org>/<repo> \
  --base <BASE_BRANCH> \
  --head $FIX_BRANCH \
  --title "fix: auto-fix <N> form errors — <form page name>" \
  --body "..."
```

PR body sections (in order):

1. **Errors fixed** — table of (file, line, error, impact, fix) covering Phase 2.
2. **Performance-bot violations fixed** — table of (file, line, type, recipe applied) covering Phase 3.5. Show "0 violations" if the first iteration was clean.
3. **Performance follow-ups** — every `needs_review` from Phase 3.5 plus any violations still present after iteration 3. One bullet each, with file:line and a one-line reason. Omit the section if empty.
4. **Form context** — form URL (or "Mode B"), steps covered (from `window.__stepLog`), telemetry counts where known.
5. **Test plan** — checklist.

If `gh` is not installed, print the push command and the GitHub compare URL:
`https://github.com/<org>/<repo>/compare/<BASE_BRANCH>...<FIX_BRANCH>`

Return the PR URL.

---

## Phase 4 — Run Report

Write `output/<domain>-<date>-auto-fix-report.md`. Required sections:

- **Header**: form URL (or "Mode B — error strings"), run date, PR URL
- **Mode A only — Phase 0 — Telemetry**: CLI command used, raw results table (all entries before dedup), deduped table, skipped entries with reasons
- **Mode A only — Phase 1 — Live Diagnosis**: form resolved (id, title, field count), panels watched, Diagnostic F results, step-walk table (panel, transition time, errors on that step), merged `allErrors[]` table
- **Mode B only — Phase E — Parsed Errors**: raw input strings, parsed table (type, file, line, fix type), skipped entries with reasons
- **Phase 2 — Fix Sub-Agents**: for each sub-agent — full prompt sent, tool calls made, finding, JSON result
- **Phase 3.1–3.4 — Apply & error-fix commit**: git commands run, exact diff output, commit SHA
- **Phase 3.5 — Performance-bot gate**: per iteration — exact CLI command, full `.perf-bot-report.md` contents, parsed `violations[]` table, sub-agent prompts + JSON results, perf-fix commit SHA. Final iteration must show 0 violations OR list the unresolved ones with reasons.
- **Phase 3.6–3.7 — Push & PR**: push command output, PR URL
- **Errors Not Fixed**: one row per skipped error with reason
- **Performance Follow-ups**: one row per `needs_review` carried forward to the PR body

Print path when done: `📄 Run report saved: output/<filename>.md`

---

## Error Handling

| Situation | Action |
|-----------|--------|
| Only error strings given, no URL | Switch to Mode B — skip Phase 0 and Phase 1 |
| `/optel-query` fails or no data | Log and proceed to Phase 1 |
| URL is not production | Skip Phase 0, go straight to Phase 1 |
| live-debug-form unavailable | Run live-debug-form Steps 1–4 manually using its tool files |
| live-debug-form can't resolve form | Follow its own error handling; if Web Worker — inform user |
| User can't provide credentials | Offer Mode B — paste error strings, fix without browser |
| `file` is the page URL (no `.js`) | Page-level fix — see `knowledge/fix-classification.md` |
| No URL, filename only | Repo-search fix — see `knowledge/fix-classification.md` |
| Source file 404 | Ask for local path |
| Minified file | Flag "cannot auto-fix"; suggest source maps |
| `needs_review: true` | Present analysis, wait for user decision |
| `old_string` not unique | Expand with more surrounding lines |
| No errors found | "Form appears healthy — no JS errors detected." |
| `git push` fails | Show push command for user to run manually |
| `~/.performance-bot/index.js` missing | Run install snippet from Phase 3.5.1; retry once |
| Performance-bot CLI install fails (no network / 404) | Skip Phase 3.5.2 with one `needs_review` "performance-bot CLI unavailable: <reason>"; surface in PR body |
| `node` < 20 | Skip Phase 3.5 with `needs_review` "Node 20+ required for performance-bot"; surface in PR body |
| Phase 3.5 still has violations after iteration 3 | Move remaining violations under "Performance follow-ups" in the PR body, do **not** loop further |
| Phase 3.5 sub-agent returns `needs_review` | Add to "Performance follow-ups" — never block the PR on it |
| Form has no JS/CSS changes (`--diff` finds 0 files) | Skip Phase 3.5.2 entirely (no violations possible); record "0 changed files" in the run report |

---

## Example invocations

**Mode A:**
```
Auto-fix all errors on https://applyonline.hdfc.bank.in/digital/etb-fixed-deposit-cc,
repo is at /Users/me/workspace/hdfc-bank-uat, branch uat-cards-release-test
```

**Mode B:**
```
Fix these errors in /path/to/my/repo on branch main:
fdSelectHandler@https://host/eds-v1-forms/fd-card/fddetailsutil.js:59:11 | typeerror: fdPanel.forEach is not a function
@https://host/eds-v1-forms/fd-card/analytics.js:79:3 | referenceerror: _satellite is not defined
```
