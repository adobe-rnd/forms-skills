---
name: splunk-mode
description: Load when the user explicitly asks to query Splunk logs — "show errors", "trace journey", "FDM performance", journey UUID, "drill deeper". Covers Modes A/B/C/D, drill-down, and the optional transition into Fix mode.
type: reference
---

# Splunk Mode

Explicit log exploration. Do **not** enter this mode from Fix mode; Fix mode reads the user-supplied stack trace directly.

## Sub-mode detection

| Trigger in user message | Mode |
|---|---|
| "analytics", "FDM", "API performance", "failure rate", "latency", "call volume" | **D** — analytics |
| Journey UUID | **C** — single-journey trace |
| "INFO" | **B** — INFO failure analysis |
| Default | **A** — ERROR aggregation |

## Step 1 — Inputs

Ask all inputs in a single `AskUserQuestion`.

**Modes A/B/C:**
- Journey ID to trace (leave blank for aggregated view)
- Log type: ERROR / INFO / both (default ERROR)
- Splunk host filter (default `hdfc-prod-pub*`)
- Look-back: 1 or 2 days (default 1)

**Mode D:**
- Date range — start (`YYYY-MM-DD`) or blank for "last N days"
- Date range — end or blank
- Days to look back if no dates (default 1)
- Splunk host filter (default `hdfc-prod-pub*`)
- Splunk index (default `ams_cq`)
- Max API routes to show (1–100, blank = all)

## Step 2 — Credentials

```bash
bash ../../shared/scripts/load-env.sh --require SPLUNK_PASS
```
If missing, ask once and offer to append to `${HOME}/form-auto-fix/.env`.

## Step 3 — Build and run

Substitute placeholders, write to `/tmp/fji_query.py`, run:

```bash
SPLUNK_PASS="$SPLUNK_PASS" python3 /tmp/fji_query.py 2>/dev/null
```

| Mode | SPL file | Runner | Placeholders |
|---|---|---|---|
| A | `tools/spl-mode-a.spl` | `tools/splunk-runner.py` | `__HOST__` |
| B | `tools/spl-mode-b.spl` | `tools/splunk-runner.py` | `__HOST__` |
| C | `tools/spl-mode-c.spl` | `tools/splunk-runner.py` | `__HOST__`, `__JOURNEY_ID__`, `__LEVEL_FILTER__` |
| D | `tools/spl-mode-d.spl` | `tools/splunk-runner-analytics.py` | `__INDEX__`, `__HOST__`, `__HEAD__` |

`__LEVEL_FILTER__` for Mode C: `"*ERROR*"`, `"*INFO*"`, or omit for both.

## Step 4 — Display

Use the analyst-narrative format in `references/error-categories.md` (Modes A/B). Mode C shows the journey trace timeline; Mode D shows the analytics ranking.

After display, offer drill-deeper.

## Step 5 — Drill deeper

When the user says `drill deeper into #N`:

Run three parallel SPL queries: `tools/spl-drill-d1.spl` (volume by hour), `d2.spl` (host distribution), `d3.spl` (sample journey IDs) — substituting `__HOST__` and `__SHORT_CLASS__`.

Show volume trend → host breakdown → sample IDs → root-cause narrative → recommended action.

## Step 6 — Transition to Fix mode

When the user says `fix #N`, `fix all structural`, or `fix all`:

1. Extract `SHORT_CLASS`, `EXCEPTION_TYPE`, `EXCEPTION_MESSAGE`, `LINE_NUMBER` from the Splunk row.
2. If no sample journey ID is available yet, run `tools/spl-journey-stack.spl` + `tools/spl-journey-info-context.spl` in parallel to get the full exception context.
3. Continue at **Fix mode Step 2** (IA triage). Splunk results replace the user-supplied error text; everything from Step 2 onward is identical.

## Failure handling

| Situation | Action |
|---|---|
| `ConnectionRefusedError` | "Cannot reach Splunk — check VPN. Host: `splunk-api.or1.adobe.net`" |
| `ModuleNotFoundError: splunklib` | "Run `pip install splunk-sdk`" |
| Empty results | "No logs found — try a wider time range or different host filter." |
