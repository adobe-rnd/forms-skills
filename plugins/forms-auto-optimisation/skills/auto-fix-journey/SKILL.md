---
name: auto-fix-journey
description: Query Splunk for AEM Forms journey logs and errors, analyze root causes, suggest fixes, and raise a PR. Supports aggregated error/INFO analysis (no journeyId), per-journey trace (journeyId provided), and FDM API analytics (route-level call counts, failure rates, latency).
compatibility: Requires Python 3 with splunk-sdk installed (`pip install splunk-sdk`). SPLUNK_PASS must be provided via env var or entered when prompted.
allowed-tools: Read Write Bash AskUserQuestion
user_invocable: true
metadata:
  author: adobe-forms
  domain: forms-debugging
---

# Journey Insights Query

## Tool files

```
tools/
├── splunk-runner.py      — Python script template (write to /tmp, substitute __SPL__/__HOURS__)
├── spl-mode-a.spl        — Mode A: ERROR aggregation (placeholders: __HOST__)
├── spl-mode-b.spl        — Mode B: INFO failure analysis (placeholders: __HOST__)
├── spl-mode-c.spl        — Mode C: Journey trace (placeholders: __HOST__, __JOURNEY_ID__, __LEVEL_FILTER__)
├── spl-mode-d.spl        — Mode D: FDM API Analytics (placeholders: __INDEX__, __HOST__, __HEAD__)
├── spl-drill-d1.spl      — Drill: Volume by hour (placeholders: __HOST__, __SHORT_CLASS__)
├── spl-drill-d2.spl      — Drill: Distribution by host (placeholders: __HOST__, __SHORT_CLASS__)
└── spl-drill-d3.spl      — Drill: Sample journey IDs (placeholders: __HOST__, __SHORT_CLASS__)
```

## Knowledge

```
knowledge/
└── error-categories.md  — Named category patterns and analyst-narrative output format spec
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

---

## Step 2 — Write and run the query script

Read `tools/splunk-runner.py`. Select the template matching the mode (standard vs. analytics), substitute placeholders, write to `/tmp/fji_query.py` (or `/tmp/fji_analytics.py` for Mode D), then run:

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

## Error Handling

| Situation | Action |
|-----------|--------|
| `ConnectionRefusedError` | "Cannot reach Splunk — check VPN. Host: `splunk-api.or1.adobe.net`" |
| `SPLUNK_PASS` empty | Ask for it via `AskUserQuestion` |
| `ModuleNotFoundError: splunklib` | "Run `pip install splunk-sdk`" |
| Empty results | "No logs found — try a wider time range or different host filter." |
| Journey trace returns no rows | "Journey ID not found in last __HOURS__h. Try 2 days or check the ID." |
| All rows have `short_class` null | "Log format not matched — paste one raw log line so I can adjust the regex." |

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
"Show API performance for 2026-04-01 to 2026-04-28"
"Top 10 slowest FDM API routes this week"
"API analytics on hdfc-uat-* for last 2 days"
```
