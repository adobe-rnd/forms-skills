---
name: auto-fix-form
description: End-to-end workflow for diagnosing and fixing AEM/EDS form errors. Queries telemetry via /optel-query, presents errors to the user for selection, uses the impact-analyser graph to trace error origins across the repo landscape, generates a per-error fix plan the user iterates on until approved, applies patches through parallel sub-agents, gates the working tree through performance-bot --diff HEAD, runs impact analysis to propagate analogous fixes into dependent repos, and raises a PR per repo. Use when the user provides a form URL to fix.
compatibility: Requires git + gh CLI for PR creation. Phase 5 requires Node 20+ and the performance-bot CLI at ~/.performance-bot/index.js — installed inline on first run if missing. Phases 5.5/5.6 require the impact-analyser CLI (`ia` in PATH, or auto-installed from adobe-aem-forms/impact-analyser GitHub releases to ~/.impact-analyser/cli/) and the impact-graph SQLite DB (auto-downloaded from adobe-aem-forms/impact-analyser-graph); degrade gracefully if either is unavailable.
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

### Error-in-invocation fast path

**If the user's message contains a JS stack frame or exception**, extract it immediately and set `ERROR_INPUT_PROVIDED=1`. Pattern to detect:
- JS stack frame: `<symbol>@<url>:<line>:<col>` (e.g. `updatedJsonObject@https://applyonline…js:3524:53`)
- JS exception: `TypeError:` / `ReferenceError:` / `RangeError:` / `EvalError:` / `URIError:` followed by a message

When `ERROR_INPUT_PROVIDED=1`:
1. Extract `EXCEPTION_TYPE` (e.g. `TypeError`), `EXCEPTION_MESSAGE` (e.g. `undefined is not an object (evaluating '…')`), `STACK_FRAME_URL` (the minified JS URL), `STACK_LINE` and `STACK_COL`.
2. **Skip Phase 2A entirely.** Do NOT invoke optel-query.
3. Pre-populate `selectedErrors[]` with a single entry built from the extracted fields: `{ type: EXCEPTION_TYPE, message: EXCEPTION_MESSAGE, fileUrl: STACK_FRAME_URL, line: STACK_LINE, col: STACK_COL, source: "invocation", count: null, pct_sessions_affected: null }`.
4. Jump directly to Phase 2.M (IA triage) after Phase 1 completes.

Print once after extraction:
```
Error extracted from invocation — skipping telemetry query.
Type    : <EXCEPTION_TYPE>
Message : <EXCEPTION_MESSAGE>
Frame   : <STACK_FRAME_URL>:<STACK_LINE>:<STACK_COL>
```

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
     # Not in the target repo — try to auto-locate before asking.
     # If the invocation arguments contain a clientlib app name (e.g.
     # /etc.clientlibs/HDFC_PLForms/…), extract it and search known locations.
     _APP_NAME=$(echo "$FORM_URL $@" | grep -oE '/etc\.clientlibs/([^/]+)/' | head -1 | cut -d/ -f3)
     REPO_PATH=""
     if [ -n "$_APP_NAME" ]; then
       # Search $HOME broadly (maxdepth 6) — no assumption about Desktop/workspace.
       # The auto-clone landing zone ~/auto-fix-form-clones is checked first since
       # it is the canonical location for skill-managed clones.
       _FOUND=$(find "$HOME/auto-fix-form-clones" "$HOME" \
         -maxdepth 6 -type d -name "$_APP_NAME" 2>/dev/null | head -1)
       if [ -n "$_FOUND" ] && git -C "$_FOUND" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
         REPO_PATH="$_FOUND"
         echo "✅ Auto-located $_APP_NAME at $REPO_PATH"
       fi
     fi
     if [ -z "$REPO_PATH" ]; then
       # Auto-locate failed — try to clone from IA config before asking.
       # IA_CONFIG is not yet resolved; search $HOME for any IA config.
       _IA_CFG=$(find "$HOME" -maxdepth 8 \
         \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
         2>/dev/null | head -1)
       if [ -n "$_IA_CFG" ] && [ -n "$_APP_NAME" ]; then
         REPO_PATH=$(ia_auto_clone "$_APP_NAME" "$_IA_CFG" 2>/dev/null)
       fi
     fi
     if [ -z "$REPO_PATH" ]; then
       # Last resort — ask the user.
       AskUserQuestion("Could not auto-locate the target repo.
   Please provide the local path to the cloned repo where the fix should be applied:")
       REPO_PATH="<user answer>"
     fi
     REPO_REMOTE=$(git -C "$REPO_PATH" remote get-url origin 2>/dev/null || echo "no remote")
     echo "Using REPO_PATH: $REPO_PATH (origin: $REPO_REMOTE)"
   fi
   ```

   If the resolved path does not exist or is not a git repo, attempt auto-clone (see helper below) before asking again. Only ask the user after both auto-locate and auto-clone have failed.

3. **Resolve IA tooling early** — done once here; Phase 5.5 reuses these variables, never re-resolves:

   > ⚠️ **`IA_CMD` must always be called with `eval $IA_CMD …`, never as `$IA_CMD …` directly.** When `IA_CMD` is `node /path/to/cli.js` (contains a space), bare variable expansion in zsh/bash treats the entire string as the executable name and fails with "no such file or directory". Every `ia` invocation in this skill uses `eval`; any new invocation (version check, test call, etc.) must too.

   ```bash
   # ── GitHub account for adobe-aem-forms repos ─────────────────────────────
   # The IA CLI, graph, and config all live in adobe-aem-forms/* repos on
   # github.com. Users may have multiple gh accounts (personal + Adobe SSO).
   # The default active account may not have access. Auto-detect which account
   # does and use its token for all IA downloads.
   _GH_IA_TOKEN=""
   _GH_IA_USER=""
   for _gh_u in $(gh auth status 2>&1 | grep -oE 'account [^ ]+' | awk '{print $2}'); do
     _tok=$(gh auth token --hostname github.com --user "$_gh_u" 2>/dev/null)
     if [ -n "$_tok" ] && GITHUB_TOKEN="$_tok" gh release list \
         --repo adobe-aem-forms/impact-analyser >/dev/null 2>&1; then
       _GH_IA_TOKEN="$_tok"
       _GH_IA_USER="$_gh_u"
       echo "✅ GitHub account '$_gh_u' has access to adobe-aem-forms"
       break
     fi
   done
   if [ -z "$_GH_IA_TOKEN" ]; then
     echo "⚠️  No gh account found with access to adobe-aem-forms — IA install will likely fail"
   fi

   # ── CLI ──────────────────────────────────────────────────────────────────
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
     GITHUB_TOKEN="$_GH_IA_TOKEN" gh release download \
       --repo adobe-aem-forms/impact-analyser \
       --pattern "impact-analyser-cli-${_OS_TAG}-${_ARCH_TAG}.tar.gz" \
       --dir /tmp --clobber 2>/tmp/ia-install-stderr.txt \
     && tar -xzf "/tmp/impact-analyser-cli-${_OS_TAG}-${_ARCH_TAG}.tar.gz" \
              -C "$HOME/.impact-analyser" \
     && IA_CMD="node $IA_INSTALL_DIR/index.js" \
     || { IA_CMD_MISSING=1
          IA_UNAVAILABLE="ia CLI install failed: $(head -2 /tmp/ia-install-stderr.txt)"; }
   fi

   # ── Config (optional — omit flag if not found, ia analyse still runs) ────
   # Search order:
   #   1. Inside REPO_PATH (maxdepth 3) — most common for monorepo setups
   #   2. Sibling directories of REPO_PATH — covers dedicated graph repos like
   #      impact-analyser-graph/impact-analyser-graph/hdfc/ that live alongside
   #      the forms repos rather than inside them
   #   3. $HOME/auto-fix-form-clones — auto-clone landing zone
   IA_CONFIG=$(find "$REPO_PATH" -maxdepth 3 \
     \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
     2>/dev/null | head -1)
   if [ -z "$IA_CONFIG" ]; then
     IA_CONFIG=$(find "$(dirname "$REPO_PATH")" -maxdepth 5 \
       \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
       2>/dev/null | head -1)
   fi
   if [ -z "$IA_CONFIG" ]; then
     IA_CONFIG=$(find "$HOME/auto-fix-form-clones" -maxdepth 5 \
       \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
       2>/dev/null | head -1)
   fi
   # 4. Broader $HOME search — catches configs in any subdirectory regardless of
   #    the user's folder structure (no assumption about Desktop/workspace).
   if [ -z "$IA_CONFIG" ]; then
     IA_CONFIG=$(find "$HOME" -maxdepth 8 \
       \( -name "impact-analyzer.config.yaml" -o -name "impact-analyser.config.yaml" \) \
       2>/dev/null | head -1)
   fi
   # 5. Not found anywhere — auto-download from adobe-aem-forms/impact-analyser-graph release.
   #    The config file itself contains no secrets (credentials are referenced as env vars).
   #    This makes the skill self-bootstrapping for new users with no local graph repo.
   if [ -z "$IA_CONFIG" ]; then
     echo "📥 IA config not found locally — downloading from adobe-aem-forms/impact-analyser-graph..."
     mkdir -p "$HOME/.impact-analyser"
     GITHUB_TOKEN="$_GH_IA_TOKEN" gh release download impact-graph-hdfc \
       --repo adobe-aem-forms/impact-analyser-graph \
       --pattern "impact-analyser.config.yaml" \
       --dir "$HOME/.impact-analyser" --clobber 2>/tmp/ia-config-dl-stderr.txt \
       && IA_CONFIG="$HOME/.impact-analyser/impact-analyser.config.yaml" \
       || echo "⚠️  Config download failed: $(head -2 /tmp/ia-config-dl-stderr.txt) — running concept-only"
   fi
   IA_CONFIG_FLAG=""; [ -n "$IA_CONFIG" ] && IA_CONFIG_FLAG="--config \"$IA_CONFIG\""

   # ── Graph DB ─────────────────────────────────────────────────────────────
   IA_GRAPH=$(find "$REPO_PATH" -maxdepth 3 -name "impact-graph.sqlite" 2>/dev/null | head -1)
   [ -z "$IA_GRAPH" ] && IA_GRAPH=$(find "$(dirname "$REPO_PATH")" -maxdepth 5 -name "impact-graph.sqlite" 2>/dev/null | head -1)
   [ -z "$IA_GRAPH" ] && IA_GRAPH=$(find "$HOME/.impact-analyser" -name "impact-graph.sqlite" 2>/dev/null | head -1)

   if [ -z "$IA_GRAPH" ]; then
     echo "📥 No local graph — downloading from adobe-aem-forms/impact-analyser-graph..."
     mkdir -p "$HOME/.impact-analyser"
     GITHUB_TOKEN="$_GH_IA_TOKEN" gh release download impact-graph-hdfc \
       --repo adobe-aem-forms/impact-analyser-graph \
       --pattern impact-graph.sqlite \
       --dir "$HOME/.impact-analyser" --clobber 2>/tmp/ia-graph-dl-stderr.txt \
       && IA_GRAPH="$HOME/.impact-analyser/impact-graph.sqlite" \
       || { IA_GRAPH_MISSING=1
            echo "⚠️  Graph download failed: $(head -2 /tmp/ia-graph-dl-stderr.txt)"; }
   fi

   # ── Node ABI check (better-sqlite3 compiled for Node 20, ABI 115) ──────────
   # The pre-built IA CLI tarball bundles a better_sqlite3.node binary compiled for
   # Node 20. Running under Node 21+ (ABI 130+) causes an immediate "MODULE_VERSION
   # mismatch" crash. Detect early and rewrite IA_CMD to use an NVM Node 20 binary.
   _NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/')
   if [ "${_NODE_MAJOR:-0}" -ge 21 ] && [ -z "$IA_CMD_MISSING" ]; then
     _NODE20=$(ls "$HOME/.nvm/versions/node/v20".*/bin/node 2>/dev/null | sort -V | tail -1)
     if [ -n "$_NODE20" ]; then
       IA_CMD="$_NODE20 $IA_INSTALL_DIR/index.js"
       echo "⚠️  System Node ${_NODE_MAJOR} — IA re-routed to Node 20 ($_NODE20) for better-sqlite3 ABI compatibility"
     else
       IA_UNAVAILABLE="IA CLI needs Node 20 (better_sqlite3 ABI 115); system is Node ${_NODE_MAJOR} and no Node 20 found in ~/.nvm. Fix: nvm install 20"
       echo "❌ $IA_UNAVAILABLE"
     fi
   fi

   # ── Graph flags (set once, reused by 2.M and 5.5.3) ─────────────────────
   IA_GRAPH_FLAG="";    [ -n "$IA_GRAPH" ] && IA_GRAPH_FLAG="--graph \"$IA_GRAPH\""
   IA_CONCEPT_ONLY="";  [ -z "$IA_GRAPH" ] && IA_CONCEPT_ONLY="--concept-only"
   ```

   Always print status before continuing:
   ```
   IA status:
     CLI   : ✅ found  (or ❌ not found)
     Graph : ✅ <path> (or ❌ download failed — triage unavailable; D1+D3 will be empty)
     Config: ✅ <path> (or ⚠️  not found — analyse runs concept-only)
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
  # AEM clientlib resolver — minified served URLs are never in the graph.
  # /etc.clientlibs/{app}/clientlibs/{lib}.min.ACSHASH<hash>.js is what AEM serves.
  # Graph node IDs have the format: {RepoName}/{relative-path}#{symbol}
  # e.g. HDFC_PLForms/ui.apps/src/.../clientlib-personal-loan/js/bre3.js#showPreviewScreen
  #
  # AEM clientlib triage — two known failure modes fixed here:
  #
  # FAILURE 1 — directory path: passing js/ as the path matches nothing; the graph
  #   stores individual file nodes, not directory nodes.
  #
  # FAILURE 2 — bare function name as --symbol: ia triage --symbol only resolves
  #   JavaClass / OSGiService / file-path suffixes. JsFunction nodes (e.g.
  #   HDFC_PLForms/.../bre3.js#showPreviewScreen) are NEVER matched by a bare name
  #   like "showPreviewScreen". This always returns "unresolved" regardless of whether
  #   the function is in the graph.
  #
  # Correct strategy for clientlib errors:
  #   1. Extract the function name from the stack frame.
  #   2. Query the graph SQLite directly for a JsFunction node matching that name.
  #   3. Strip #functionName to get the source .js file path.
  #   4. Use the last 3 path segments (e.g. clientlib-personal-loan/js/bre3.js) as
  #      the --symbol value — this IS a file-suffix and resolves correctly.
  #   5. Fall back to path-based stack-trace triage if the SQLite lookup finds nothing.
  resolved_url="<fileUrl>"
  symbol_name=""
  clientlib_app=""
  clientlib_lib=""
  if [[ "<fileUrl>" =~ /etc\.clientlibs/([^/]+)/clientlibs/([^.]+)\.min\.ACSHASH[^.]+\.js ]]; then
    clientlib_app="${BASH_REMATCH[1]}"
    clientlib_lib="${BASH_REMATCH[2]}"
    # Repo-prefixed path (matches graph ID format: {app}/ui.apps/...)
    resolved_url="${clientlib_app}/ui.apps/src/main/content/jcr_root/apps/${clientlib_app}/clientlibs/${clientlib_lib}/js/"
    # Extract function/symbol name from the stack frame (e.g. "showPreviewScreen@https://...")
    symbol_name=$(echo "<raw_stack_frame>" | sed 's/@.*//')
  fi

  # Strategy 1 (clientlib primary): SQLite lookup → file-path suffix → triage.
  # DO NOT pass the bare function name as --symbol — it will always return unresolved.
  # Instead, find the JsFunction node in the graph to get the actual source file path.
  if [[ -n "$symbol_name" ]] && [[ -n "$IA_GRAPH" ]]; then
    _js_node=$(sqlite3 "$IA_GRAPH" \
      "SELECT id FROM nodes WHERE id LIKE '%#${symbol_name}' AND type='JsFunction' LIMIT 1;" \
      2>/dev/null)
    if [[ -n "$_js_node" ]]; then
      # Strip #functionName suffix, take last 3 path segments as the file-suffix symbol
      _src_file=$(echo "$_js_node" | sed 's/#.*//')
      _triage_symbol=$(echo "$_src_file" | awk -F'/' '{print $(NF-2)"/"$(NF-1)"/"$NF}')
      eval $IA_CMD triage \
        --graph "$IA_GRAPH" \
        --symbol "$_triage_symbol" \
        --format json \
        > "$RUN_OUTPUT_DIR/ia-triage-<error_id>.json" 2>/dev/null
    fi
    # If sqlite lookup found nothing, _triage_symbol is unset → fall through to Strategy 2
  fi

  # Strategy 2: path-based triage using the repo-prefixed source path.
  # Run when: (a) no symbol name, OR (b) Strategy 1 found no JsFunction node in graph,
  #           OR (c) triage output is empty after Strategy 1.
  if [[ -z "$symbol_name" ]] || [[ -z "$(cat $RUN_OUTPUT_DIR/ia-triage-<error_id>.json 2>/dev/null)" ]]; then
    cat > /tmp/ia-triage-<error_id>.txt <<EOF
  <type>: <message>
    at ${resolved_url}:<line>
  EOF

    eval $IA_CMD triage \
      --graph "$IA_GRAPH" \
      --stack-trace /tmp/ia-triage-<error_id>.txt \
      --format json \
      > "$RUN_OUTPUT_DIR/ia-triage-<error_id>.json" 2>/dev/null
  fi

  # Attach the triage JSON as iaContext on the allErrors[] entry (best-effort)
  entry.iaContext = (parse $RUN_OUTPUT_DIR/ia-triage-<error_id>.json) || null
```

If `IA_GRAPH` is absent (download failed or `IA_GRAPH_MISSING` set), skip triage — `iaContext` is null for all entries and plan sub-agents fall back to source-only analysis.

**CWD-first check for clientlib entries where triage returned no graph matches.** When `entry.iaContext` is null AND the error came from a minified clientlib URL (i.e. `resolved_url` was rewritten to a `ui.apps/…/js/` source path), check whether that source path exists inside `REPO_PATH` before treating it as a foreign repo:

```bash
for each entry where entry.iaContext == null AND entry.resolvedClientlibPath is set:
  clientlib_src="$REPO_PATH/${entry.resolvedClientlibPath}"
  if [ -d "$clientlib_src" ] && ls "$clientlib_src"*.js 2>/dev/null | head -1 >/dev/null; then
    # Source lives in the current repo — no cross-repo ask needed
    entry.targetRepoPatch = null
    echo "✅ Clientlib source found in current repo: $clientlib_src"
  else
    # Source not found in current repo — will surface in the cross-repo ask below
    entry.clientlibNotInCurrentRepo = true
    echo "⚠️  Clientlib source '$clientlib_src' not in current repo — will ask for clone path"
  fi
```

**After triage, check if the fix targets a different repo.** Collect foreign repos from two sources: (a) entries where `iaContext` identifies a source repo that differs from `basename("$REPO_PATH")`, and (b) entries where `entry.clientlibNotInCurrentRepo == true`. For all such entries, **auto-resolve the path without asking the user**:

```bash
# ── Auto-resolve helper (ia_auto_clone) ────────────────────────────────────
# Called whenever a foreign repo is needed. Tries locations in order; only
# asks the user if every automatic strategy fails.
ia_auto_clone() {
  local REPO_NAME="$1"
  local CFG="${2:-$IA_CONFIG}"
  local CLONE_DIR="$HOME/auto-fix-form-clones"

  # 1. Already cloned in the standard landing zone?
  git -C "$CLONE_DIR/$REPO_NAME" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    && { echo "$CLONE_DIR/$REPO_NAME"; return 0; }

  # 2. Sibling of REPO_PATH?
  local _SIB="$(dirname "$REPO_PATH")/$REPO_NAME"
  git -C "$_SIB" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    && { echo "$_SIB"; return 0; }

  # 3. IA workspace from config?
  local _WS=""
  [ -n "$CFG" ] && _WS=$(node -e "
    try {
      const y = require('fs').readFileSync('$CFG','utf8');
      const m = y.match(/^workspace:\s*(.+)/m);
      if (m) console.log(m[1].replace(/\\\${IA_WORKSPACE}/g, process.env.IA_WORKSPACE||'').trim());
    } catch(e) {}
  " 2>/dev/null)
  if [ -n "$_WS" ]; then
    git -C "$_WS/$REPO_NAME" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
      && { echo "$_WS/$REPO_NAME"; return 0; }
  fi

  # 4. Not found locally — auto-clone from IA config.
  if [ -n "$CFG" ]; then
    local _INFO
    _INFO=$(node -e "
      try {
        const y = require('fs').readFileSync('$CFG','utf8');
        // Walk github_orgs blocks; find the one containing 'name: REPO_NAME'
        const orgs = y.split(/^- name:/m).slice(1);
        for (const blk of orgs) {
          // org-level name is the first 'name:' line in the block
          const orgM = blk.match(/^\s{0,2}(\S[^\n]*)/);
          const hostM = blk.match(/host:\s*(.+)/);
          if (hostM && blk.match(new RegExp('- name:\\\\s*$REPO_NAME(\$|\\\\s)', 'm'))) {
            const orgName = y.match(/^- name:\\s*(\\S+)/m)?.[1] || '';
            // Find this org's name from the split marker that preceded this block
            console.log(hostM[1].trim());
            break;
          }
        }
        // simpler fallback: grep for host near the repo name
        const lines = y.split('\\n');
        let host='', inOrg=false;
        for (const l of lines) {
          if (/^- name:/.test(l)) { inOrg=true; host=''; }
          if (inOrg && /host:/.test(l)) host = l.split('host:')[1].trim();
          if (inOrg && new RegExp('- name:\\\\s*$REPO_NAME').test(l)) {
            // find org name (first line after '- name:' before this repo)
            const orgIdx = y.lastIndexOf('- name:', y.indexOf('- name: $REPO_NAME'));
            const orgLine = y.slice(orgIdx).match(/- name:\\s*(\\S+)/);
            if (orgLine) console.log(host + ' ' + orgLine[1]);
            process.exit(0);
          }
        }
      } catch(e) { process.exit(1); }
    " 2>/dev/null)
    local _HOST=$(echo "$_INFO" | awk '{print $1}')
    local _ORG=$(echo  "$_INFO" | awk '{print $2}')
    if [ -n "$_HOST" ] && [ -n "$_ORG" ]; then
      mkdir -p "$CLONE_DIR"
      echo "📥 Auto-cloning $REPO_NAME from $_HOST/$_ORG/$REPO_NAME …"
      git clone "https://$_HOST/$_ORG/${REPO_NAME}.git" "$CLONE_DIR/$REPO_NAME" --depth 1 \
        2>/tmp/ia-clone-${REPO_NAME}-stderr.txt \
        && { echo "$CLONE_DIR/$REPO_NAME"; return 0; } \
        || echo "❌ Clone failed: $(head -2 /tmp/ia-clone-${REPO_NAME}-stderr.txt)"
    fi
  fi

  # 5. All automatic strategies exhausted — ask once.
  echo "__ASK__"
  return 1
}
```

For each foreign repo:

```bash
for REPO_NAME in <foreign_repo_list>; do
  _RESOLVED=$(ia_auto_clone "$REPO_NAME")
  if [ "$_RESOLVED" = "__ASK__" ]; then
    # Only ask if auto-clone truly failed
    AskUserQuestion("Could not auto-clone $REPO_NAME.
Please enter the local path (or 'skip' to search in current repo):")
    _RESOLVED="<user answer>"
    [ "$_RESOLVED" = "skip" ] && _RESOLVED=""
  fi
  if [ -n "$_RESOLVED" ] && git -C "$_RESOLVED" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "✅ $REPO_NAME → $_RESOLVED"
    # Set on all errors pointing to this repo:
    entry.targetRepoPatch = { repoPath: "$_RESOLVED", repoName: "$REPO_NAME" }
  else
    echo "⚠️  $REPO_NAME unresolved — plan sub-agents will fall back to REPO_PATH"
    entry.targetRepoPatch = null
  fi
done
```

Set `entry.targetRepoPatch = { repoPath: "<path>", repoName: "<name>" }` on all errors whose `iaContext` points to that repo. For unresolved repos: `entry.targetRepoPatch = null` — plan sub-agents search `REPO_PATH` instead.

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

Each sub-agent returns JSON only — one of three shapes:

**Normal plan entry:**
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

**Needs more information (confidence gate):**
```json
{
  "error_id": 1,
  "need_more_info": true,
  "questions": [
    "<specific question 1 — name the exact field, config key, or runtime value needed>",
    "<specific question 2>"
  ],
  "what_i_know": "one paragraph: what the code does, what the throw site is, why the root cause is ambiguous without the missing data"
}
```

Use `need_more_info` only when the correct fix genuinely depends on runtime data not visible from source (e.g. an OSGi config value, an API response field, a DB row). Do NOT use it as a default hedge — a null-guard visible in source is always plannable without more data.

When a sub-agent returns `need_more_info: true`:
- Add the entry to `plan[]` with status `needs_more_info`.
- Surface the questions to the user in Phase 3.2 (separate "Awaiting answers" section).
- Block `approve` until all `needs_more_info` entries are either answered (triggering a sub-agent re-run with the new context) or explicitly skipped by the user.
- On user answer: re-spawn the planning sub-agent for that entry, seeding the prompt with the original error + `what_i_know` + the user's answers. The sub-agent must now return a normal plan entry or `needs_review`.
- On user `skip <N>`: move the entry to `needs_review` status with reason "skipped by user — insufficient data".

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
```

If any entries have status `needs_more_info`, print them in a separate section **before** the command line:

```
⚠️  Awaiting answers before these can be planned:

[3] ServiceException — Journey state mismatch
    what I know : <what_i_know paragraph>
    Questions:
      a) <question 1>
      b) <question 2>
```

**`approve` is blocked** while any `needs_more_info` entries exist. Remind the user:

```
Commands: answer <N>: <text> | skip <N> | approve | skip <N> | redo <N>: <guidance> | add: <error> | regenerate | cancel
(approve is blocked — answer or skip entries [3] first)
```

Once all entries are resolved (answered → re-planned, or skipped → needs_review), `approve` is unblocked and the standard command line applies:

```
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

   # Build branch name; if it already exists on remote, append -v2, -v3, …
   # to avoid a "fetch first" push rejection when the same form is fixed twice
   # on the same day.
   FIX_BRANCH="fix/auto-fix-<form-slug>-<TODAY>"
   _v=2
   while git -C "$T" ls-remote --exit-code --heads origin "$FIX_BRANCH" >/dev/null 2>&1; do
     FIX_BRANCH="fix/auto-fix-<form-slug>-<TODAY>-v${_v}"
     _v=$((_v + 1))
   done

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

Each sub-agent returns one of:

**Normal patch:**
```json
{ "file_relative": "...", "old_string": "...", "new_string": "...", "explanation": "one sentence" }
```

**Needs review** (patch too complex after deeper inspection — rare, plan was already approved):
```json
{ "needs_review": true, "analysis": "..." }
```
Append to `needsReview[]` and continue.

**Needs more information** (fix sub-agent safety net — should be caught at Phase 3.1, but may occur if runtime data requirements only become clear when reading the exact patch site):
```json
{
  "need_more_info": true,
  "questions": ["<specific question 1>", "<specific question 2>"],
  "what_i_know": "one paragraph: what the code does, what the throw site is, why the root cause is ambiguous"
}
```
When this happens: pause immediately, surface the questions to the user, wait for their answer, then re-spawn this sub-agent with the original prompt + the user's answers. Do not apply any subsequent patches until this entry is resolved. If the user says "skip it", treat as `needs_review: true`.

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

### 5.5.1 + 5.5.2 — Reuse Phase 1 IA variables

`IA_CMD`, `IA_GRAPH`, `IA_GRAPH_FLAG`, `IA_CONCEPT_ONLY`, `IA_CONFIG`, `IA_CONFIG_FLAG`, and `IA_UNAVAILABLE` were all resolved and set in Phase 1. Prefer reusing them. However, **context compaction can erase in-memory variables** mid-session. Guard and re-resolve if needed:

```bash
# Re-resolve IA_CMD if lost (e.g. context compaction between phases)
if [ -z "$IA_CMD" ] && [ -z "$IA_CMD_MISSING" ]; then
  IA_INSTALL_DIR="$HOME/.impact-analyser/cli"
  if command -v ia >/dev/null 2>&1; then
    IA_CMD="ia"
  elif [ -f "$IA_INSTALL_DIR/index.js" ]; then
    IA_CMD="node $IA_INSTALL_DIR/index.js"
  else
    IA_CMD_MISSING=1
    IA_UNAVAILABLE="ia CLI not found — install will be attempted if Phase 1 runs again"
  fi
fi

# Verify CLI works — MUST use eval (IA_CMD may contain spaces)
if [ -n "$IA_CMD" ] && ! eval $IA_CMD --version >/dev/null 2>&1; then
  IA_UNAVAILABLE="ia CLI found but not executable (eval $IA_CMD --version failed)"
fi

# Re-resolve graph if lost
[ -z "$IA_GRAPH" ] && IA_GRAPH=$(find "$HOME/.impact-analyser" -name "impact-graph.sqlite" 2>/dev/null | head -1)
[ -z "$IA_GRAPH" ] && IA_CONCEPT_ONLY="--concept-only"
IA_GRAPH_FLAG=""; [ -n "$IA_GRAPH" ] && IA_GRAPH_FLAG="--graph \"$IA_GRAPH\""

if [ -n "$IA_UNAVAILABLE" ]; then
  echo "⚠️  IA unavailable: $IA_UNAVAILABLE — skipping impact analysis"
fi
```

- `IA_CONFIG_FLAG` is already set to `--config "<path>"` or empty string — use as-is.
- `IA_GRAPH_FLAG` is already set to `--graph "<path>"` or empty string — use as-is.
- `IA_CONCEPT_ONLY` is `--concept-only` when no graph, empty otherwise.

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
    $IA_CONFIG_FLAG \
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
    # Auto-clone via ia_auto_clone helper (defined in Phase 2.M)
    _CLONED=$(ia_auto_clone "$REPO_NAME")
    if [ "$_CLONED" != "__ASK__" ] && [ -n "$_CLONED" ]; then
      CROSS_REPO_PATHS["$REPO_NAME"]="$_CLONED"
      echo "✅ Auto-cloned $REPO_NAME → $_CLONED"
    else
      echo "⚠️  Skipping $REPO_NAME — auto-clone failed (check GHE_ADOBE_TOKEN / HDFC_FORMS_TOKEN)"
    fi
  fi
done <<< "$IMPACTED_REPOS"
```

If auto-clone fails (e.g. missing auth token), log the repo as skipped and list it in the PR as "Clone failed — manual check needed". Do not ask the user unless every automated strategy has been exhausted.

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
| Phase 3.1 sub-agent returns `need_more_info` | Add to plan as `needs_more_info`; block `approve`; surface questions; re-run after user answers or `skip <N>` moves to `needs_review` |
| Phase 4.2 sub-agent returns `need_more_info` | Pause; surface questions to user; re-spawn sub-agent with answers; if user skips → `needs_review` |
| Phase 4.2 sub-agent returns `needs_review` | Add to PR "Manual review needed"; continue |
| `old_string` not unique | Expand context; re-spawn sub-agent if needed |
| Phase 5 CLI missing / Node < 20 / install fails | Set `PERF_BOT_INSTALL_FAILED`; skip 5.2; commit error fixes; surface in PR |
| Phase 5.2 — violations after iter 3 | Move remaining to "Performance follow-ups"; do not loop |
| Phase 5.2 sub-agent returns `needs_review` | Add to "Performance follow-ups" |
| `.perf-bot-report.md` missing/malformed | `needsReview` entry; break loop; proceed to 6.1 |
| Both `errorFixedFiles[]` and `perfFixedFiles[]` empty | Skip commit; let 6.3 decide whether to open PR |
| `pwd` not in any git repo | Extract app name from clientlib URL; search `$HOME/Desktop/workspace/`, `$HOME/auto-fix-form-clones/`, sibling dirs; auto-clone via `ia_auto_clone` if not found; only ask user after all strategies fail |
| IA triage in 2.M identifies a different origin repo | Ask the user for its local path in 2.M before proceeding to Phase 3; `skip` proceeds with `REPO_PATH` and source-only analysis |
| User-supplied target repo path is invalid / not a git repo | Re-ask once; if still invalid, fall back to `REPO_PATH` and note in plan entry |
| Run interrupted between 4.3 and 6.1 | On retry, ask whether to discard or stash — never auto-discard |
| `git push` fails | Show command; continue to 6.3 with `needs_review "branch not pushed"` |
| Phase 5.5 — `ia` CLI not found and not at known local path | Set `IA_UNAVAILABLE`; skip 5.5.2–5.5.3; PR section shows callout to run manually |
| Phase 5.5 — no `impact-analyzer.config.yaml` found | `IA_CONFIG_FLAG` is empty string; `ia analyse` still runs without `--config`; PR notes "config not found — concept-only analysis" |
| Phase 5.5 — no graph DB found | Use `--concept-only`; D1 + D3 sections will be empty but D2 concept analysis still runs |
| Phase 5.5 — `ia analyse` exits non-zero or produces empty output | Set `IA_UNAVAILABLE`; log stderr to `ia-stderr.txt`; continue to Phase 6 |
| Phase 5.6 — `IA_JSON` missing or Phase 5.5 failed | Skip Phase 5.6 entirely; note in PR "cross-repo propagation skipped — IA unavailable" |
| Phase 5.6 — no impacted repos in IA JSON | `IMPACTED_REPOS` empty; skip Phase 5.6; primary PR notes "no dependent repos identified" |
| Phase 5.6 — dependent repo has no local clone | Call `ia_auto_clone` (searches sibling dirs, IA workspace, then git-clones from IA config); if clone fails due to missing auth token, list as "Clone failed — manual check needed" in PR |
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
