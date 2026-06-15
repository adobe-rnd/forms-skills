---
name: auto-fix-journey
description: Fixes backend Java errors in AEM Forms. Five entry points: (1) Telemetry mode — user provides a form URL, skill queries optel for API errors in last 1 day and lets user select which to fix; (2) Fix mode — user provides a stack trace or class+line; (3) API Error mode — user provides an API path or error label (e.g. "High API Errors"), skill queries Splunk; (4) Splunk mode — explicit log exploration; (5) Infrastructure mode — WAF/CDN/ELB layer diagnosis when ams_cq returns no Java results or user targets a specific infra layer. Uses impact-analyser graph for repo/file routing.
compatibility: Requires git + gh CLI. Auto-installs impact-analyser CLI into ~/.impact-analyser/ on first run. Python 3 + splunk-sdk required only for Splunk mode.
allowed-tools: Read Write Edit Bash Agent AskUserQuestion
metadata:
  author: adobe-forms
  domain: forms-debugging
  user_invocable: "true"
---

# Auto Fix Journey

End-to-end pipeline for backend Java errors in AEM Forms: classify → user-approve a plan → patch → PR.

## Routing — first match wins

| User message | Mode | Where |
|---|---|---|
| Java stack frame / exception name / `ClassName:line` | **Fix mode** | this file |
| Form URL alone (no stack, no API) | **Telemetry mode** | `references/telemetry-mode.md` |
| API path + 4xx/5xx / error label | **API Error mode** | `references/api-error-mode.md` |
| UUID / "trace journey" / "show errors" / "drill deeper" / "FDM performance" | **Splunk mode** | `references/splunk-mode.md` |
| "check WAF" / "WAF block" / "403 blocked" / "check CDN" / "CloudFront" / "check ELB" / "502" / "503" / "504" / "check infra" / "where is it failing" | **Infrastructure mode** | this file |
| Anything else | Ask which one applies | — |

Telemetry, API Error, and Splunk modes all transition into Fix mode at **Step 2** once they have enough context. Infrastructure mode is a separate diagnostic path.

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

## Step 10 — Raise PR

`gh pr create` per `shared/references/branch-and-commit.md`. PR body sections:

1. **Error context** — exception, stack trace extract, source class:line, IA trail (or "IA unavailable").
2. **Errors fixed** — table: class, exception, fix type, explanation. Structural fixes only.
3. **Flagged for manual review** — logic-type entries with manual-test checklists.
4. **Framework recommendations** — config-type entries with CRX / FDM paths.
5. **Test plan** — focused on the journeys / forms affected by this error.

---

# INFRASTRUCTURE MODE

Use when the user explicitly names an infrastructure layer or error code, OR when Step E5 auto-escalation fires from API Error mode.

## Step F0 — Parse inputs and identify target layer(s)

Extract from user message:
- `INFRA_LAYER` — `WAF` / `CDN` / `ELB` / `ALL` (if "check all layers" or "where is it failing")
- `API_PATH` — route or page URL (e.g. `/baas/getCustomerStatus`, `/digital/pl-journey`)
- `HTTP_STATUS` — numeric status code if mentioned
- `HOURS` — look-back window [default: 24]

If `INFRA_LAYER` is not determinable from the message AND `HTTP_STATUS` is provided:
→ read `references/infra-routing.md`, look up `HTTP_STATUS` → set `INFRA_LAYER` to primary layer.

If neither is determinable: ask once:
```
AskUserQuestion:
  1. Which layer to check? WAF / CDN / ELB / all
  2. API path or page URL affected
  3. HTTP status code (if known)
  4. Time window in hours [default: 24]
```

## Step F1 — Resolve hostnames

Host filter format differs per index. Check message first; ask per layer if missing:

| Layer | Index | Splunk host field | Ask prompt example |
|---|---|---|---|
| WAF | `dx_ams_aws_waf` | AWS WAF ACL name | "WAF host filter? e.g. hdfc-prod-waf* (blank = *)" |
| CDN | `dx_ams_aws_cf` | CloudFront distribution ID | "CloudFront distribution filter? e.g. E1ABC2* (blank = *)" |
| ELB | `ams_aws_elb_access` / `aws_elb_access` | Shared EC2 node IPs, e.g. `ip-10-153-244-*.or2.adobe.net` | Use `"*"` for host; always add customer keyword (e.g. `"hdfc"`) as `__CUSTOMER__` |

**ELB is multi-tenant:** `ams_aws_elb_access` contains logs from all AMS customers on shared ELB nodes. The Splunk `host` is always an internal IP. Always set `__CUSTOMER__` to the customer name (e.g. `hdfc`) so the SPL filters by ELB name in the raw log. If unknown, ask:
```
AskUserQuestion: "Customer name for ELB filter? (e.g. hdfc, blank = search all tenants — very slow)"
```

Blank answer → use `"*"` for host, `"*"` for customer, and warn: `"Using wildcard — query covers all tenants and will be slow."`

## Step F2 — Validation probe

Before running full SPL, confirm the index has data:

```bash
# Run for each target layer
search index=<TARGET_INDEX> host="<HOST_FILTER>" earliest=-<HOURS>h | stats count
```

- `count == 0` → tell user, ask to adjust hostname or time window; do not proceed
- `count > 0`  → proceed to Step F3

## Step F3 — Query target layer(s)

Read `tools/splunk-runner-infra.py`. For each target layer, read the matching SPL file, substitute placeholders, write to `/tmp/fji_infra_<layer>.py`, run:

```bash
SPLUNK_PASS="<pass>" python3 /tmp/fji_infra_<layer>.py 2>/dev/null
```

| Layer | SPL file | Placeholders |
|---|---|---|
| WAF | `spl-infra-waf.spl` | `__HOST__`, `__URI_FILTER__`, `__EARLIEST__`, `__LATEST__` |
| CDN | `spl-infra-cdn.spl` | `__HOST__`, `__URI_FILTER__`, `__EARLIEST__`, `__LATEST__` |
| ELB | `spl-infra-elb.spl` | `__HOST__`, `__URI_FILTER__`, `__EARLIEST__`, `__LATEST__`, `__CUSTOMER__` |

`__URI_FILTER__` → `API_PATH` if provided, else `"*"`.
`__EARLIEST__` / `__LATEST__` → Unix epoch integers computed by runner from `HOURS`.
`__CUSTOMER__` (ELB only) → customer keyword resolved in Step F1 (e.g. `hdfc`). Must be a plain alphanumeric keyword — the SPL wraps it in quotes. Use `*` to skip customer filtering (slow — scans all tenants).

**Parallelism:** when `INFRA_LAYER=ALL`, run all three queries in parallel (single message, multiple `Agent` uses each running one query). Collect all results before Step F4.

## Step F4 — Present root cause analysis

Follow the output format in `references/infra-routing.md`.

**Single layer result:**

```
Infrastructure Analysis — <LAYER> — <URI> — last <N>h

Root cause: <one sentence — what rule/condition is causing the failure>

| Metric        | Value                                           |
|---------------|-------------------------------------------------|
| Occurrences   | <N>                                             |
| First seen    | <timestamp>                                     |
| Last seen     | <timestamp>                                     |
| Pattern       | <WAF rule ID / CDN status+cache / ELB backend>  |
| Affected URIs | <list>                                          |

Sample events:
  [<timestamp>] <raw log excerpt — 200 chars>

Recommended action: <specific next step>
```

**Correlated result (ALL layers or Step E5 failure-chain):**

```
Failure Chain Analysis — <URI> — last <N>h

Layer        | Status     | Finding
-------------|------------|---------------------------------------------------
WAF          | ✅ clean   | No blocks matching this path
ELB          | ❌ hit     | 847 × 502 — backend <IP> unhealthy since 09:14
AEM (ams_cq) | ⚠️  silent | 0 logs — request never reached AEM

Root cause: <one sentence identifying the exact break in the chain>

Recommended action: <specific next step>
```

Severity classification (from `references/infra-routing.md`):
- **systemic** — > 1 000 occurrences or affects all requests to the path
- **recurring** — 100–1 000 occurrences
- **sporadic** — < 100 occurrences

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
| Mode F — validation probe returns count=0 | Tell user; ask to adjust hostname pattern or widen time window; do not run full query |
| Mode F — index inaccessible (connection refused / permissions) | "Cannot reach `<INDEX>` — check VPN and Splunk permissions for this index" |
| Mode F — WAF/CDN/ELB host pattern unknown | Ask once; blank → use `"*"` with slowness warning |
| Mode F — all three infra layers return empty | "No infra signal found for `<PATH>` in last `<N>`h. AEM app logs (ams_cq) are the best next step." |
| Mode F — ams_cq has partial results AND infra hit | Present both: AEM partial findings + infra root cause side-by-side |
| Step E5 fires but HTTP_STATUS not known | Default escalation order: ELB → WAF → CDN |

For Splunk-specific failures (ConnectionRefused, splunklib missing) see `references/splunk-mode.md`.
