# Design: auto-fix-journey — Infrastructure Layer Splunk Querying

**Date:** 2026-05-25
**Skill:** `plugins/forms-auto-optimisation/skills/auto-fix-journey`
**Status:** Approved for implementation

---

## Problem

`auto-fix-journey` currently queries only `index=ams_cq` (AEM Java application logs). When a failure occurs at the WAF, CDN, or load balancer layer — before the request ever reaches AEM — `ams_cq` returns zero results and the skill provides no actionable diagnosis. ELK is bank-managed and not accessible; Splunk is the only log store available for infrastructure-layer investigation.

---

## Scope

Add infrastructure-layer querying (WAF, CDN, ELB) to `auto-fix-journey` via:

1. **Mode F** — explicit invocation when the user names a layer or error code
2. **Auto-escalation hook in Mode E** — fires when `ams_cq` returns no Java results

Frontend log querying is out of scope for this change.

---

## Architecture

### New files

```
skills/auto-fix-journey/
├── SKILL.md                          ← add Mode F entry point + Mode E escalation hook
├── tools/
│   ├── spl-infra-waf.spl             ← WAF block analysis
│   ├── spl-infra-cdn.spl             ← CloudFront error/latency analysis
│   ├── spl-infra-elb.spl             ← ALB/ELB 5xx + target health analysis
│   └── splunk-runner-infra.py        ← runner using ISO earliest/latest (not hours)
└── knowledge/
    └── infra-routing.md              ← HTTP status → layer routing table + output format rules
```

Existing files (`spl-mode-a.spl` through `spl-mode-e.spl`, `splunk-runner.py`, `splunk-runner-analytics.py`) are unchanged.

---

## HTTP Status → Layer Routing Table

Lives in `knowledge/infra-routing.md`. Read at the start of Mode E and Mode F.

| HTTP Status | Primary layer | Secondary layer (if primary empty) |
|---|---|---|
| 400 | `ams_cq` | WAF |
| 401 | `ams_cq` | — |
| 403 | WAF | `ams_cq` |
| 404 on API path | `ams_cq` | CDN |
| 404 on asset/JS file | CDN | `ams_cq` |
| 429 | WAF (rate limit) | — |
| 500 | `ams_cq` | — |
| 502 | ELB | `ams_cq` |
| 503 | ELB | CDN |
| 504 | ELB (timeout) | CDN |
| 520–524 | CDN (CF-specific) | — |

**Decision rule:**
- HTTP status code provided → use routing table, query primary layer first
- No status code, no Java class in `ams_cq` → correlate all three layers in sequence
- Specific layer named by user → query that layer independently

---

## Mode F — Explicit Infrastructure Mode

### Entry point triggers (added to SKILL.md routing table)

| User message contains… | Routes to |
|---|---|
| "check WAF", "WAF block", "403", "request blocked" | Mode F → WAF |
| "check CDN", "CloudFront", "cache", "asset not loading", "page 404", "520"–"524" | Mode F → CDN |
| "check ELB", "check ALB", "502", "503", "504", "load balancer", "instance down" | Mode F → ELB |
| "check infra", "check all layers", "where is it failing" | Mode F → correlated (all three) |

### Inputs

Gathered in a single `AskUserQuestion` if not present in the user's message:

```
1. API path or page URL affected  (e.g. /baas/getCustomerStatus)
2. HTTP status code               (if known)
3. Time window: last N hours      [default: 24]
4. Host/resource filter           (see Hostname section below)
```

### Hostname handling

Host filter format differs per index. Ask per layer if not provided:

| Layer | Index | Filter format | Default ask |
|---|---|---|---|
| WAF | `dx_ams_aws_waf` | AWS resource name | `hdfc-prod-waf*` (ask if unknown) |
| CDN | `dx_ams_aws_cf` | CloudFront distribution ID | `E1*` or `*` (ask if unknown) |
| ELB | `ams_aws_elb_access` / `aws_elb_access` | ALB/ELB name | `hdfc-prod-alb*` (ask if unknown) |
| AEM | `ams_cq` | existing pattern | `hdfc-prod-pub*` (unchanged) |

Prompt when missing:
```
AskUserQuestion:
  Which host/resource filter for <WAF|CDN|ELB> logs?
  (Leave blank for wildcard "*" — may be slow on large indexes)
  Examples: hdfc-prod-waf* / E1ABC2* / hdfc-prod-alb*
```

### Query validation step

Before running the full SPL, run a lightweight count probe:

```
search index=<TARGET_INDEX> host="__HOST__" earliest=-__HOURS__h | stats count
```

- `count == 0` → tell user, ask to adjust hostname/time window before proceeding
- `count > 0` → proceed with full SPL

### Per-layer queries

**WAF** (`spl-infra-waf.spl`, index `dx_ams_aws_waf`):
- Extracts: rule ID, action (BLOCK/COUNT/ALLOW), rule group, matched URI, source IP, occurrence count
- Filters to BLOCK and COUNT actions only

**CDN** (`spl-infra-cdn.spl`, index `dx_ams_aws_cf`):
- Extracts: HTTP status, cache status (Hit/Miss/Error/Bypass), origin response time (ms), edge location, URI
- Filters to status ≥ 400

**ELB** (`spl-infra-elb.spl`, indexes `ams_aws_elb_access` / `aws_elb_access`):
- Sourcetypes: `aws:alb:accesslogs` (ALB) and `aws:elb:accesslogs` (classic ELB) — both covered
- Extracts: backend status code, backend processing time (ms), target IP, target port, URI
- Filters to backend status ≥ 400

### Output format (per layer)

```
Infrastructure Analysis — <LAYER> — <URI> — last <N>h

Root cause: <one sentence>

| Metric       | Value                                          |
|--------------|------------------------------------------------|
| Occurrences  | <N>                                            |
| First seen   | <timestamp>                                    |
| Last seen    | <timestamp>                                    |
| Pattern      | <WAF rule / CDN status+cache / ELB backend code> |
| Affected URIs| <list>                                         |

Sample events:
  [<timestamp>] <raw log excerpt — 200 chars>

Recommended action: <specific next step>
```

---

## Mode E Auto-escalation Hook

### Trigger conditions (any one is sufficient)

1. `ams_cq` returns zero rows for the API path + time window
2. `ams_cq` returns rows but no Java class is extractable (pure HTTP log, no exception)
3. HTTP status code provided and `infra-routing.md` maps it to a non-`ams_cq` primary layer

### Escalation sequence

```
Mode E queries ams_cq
        ↓
Trigger condition met?
        ↓ YES
Read HTTP status code from input
        ↓
Look up infra-routing.md → primary layer
        ↓
Run validation probe on primary index
        ↓
Query primary layer
        ↓
Results found?
  YES → present layer-specific root cause report, stop
  NO  → query secondary layer (from routing table)
        ↓
  Results found?
    YES → present report, stop
    NO  → correlate all three layers in sequence (WAF → ELB → CDN), present unified failure-chain report
```

### Unified failure-chain report format

```
Failure Chain Analysis — <API_PATH> — last <N>h

No Java exception found in AEM logs (ams_cq).
Checking infrastructure layers...

Layer        | Status    | Finding
-------------|-----------|------------------------------------------------
WAF          | ✅ clean  | No blocks matching this path
ELB          | ❌ hit    | 847 × 502 — backend <IP> unhealthy since 09:14
AEM (ams_cq) | ⚠️ silent | 0 logs — request never reached AEM

Root cause: <one sentence identifying the exact break in the chain>

Recommended action: <specific next step>
```

---

## SPL Files

### `spl-infra-waf.spl`

```spl
-- Mode F / WAF: Block analysis for a specific URI or host
-- Placeholders: __HOST__, __URI_FILTER__, __HOURS__

search index=dx_ams_aws_waf host="__HOST__" earliest=__EARLIEST__ latest=__LATEST__
| search "__URI_FILTER__"
| rex field=_raw "\"action\":\"(?<action>[^\"]+)\""
| rex field=_raw "\"ruleId\":\"(?<rule_id>[^\"]+)\""
| rex field=_raw "\"ruleGroupId\":\"(?<rule_group>[^\"]+)\""
| rex field=_raw "\"uri\":\"(?<uri>[^\"]+)\""
| rex field=_raw "\"httpSourceId\":\"(?<source_ip>[^\"]+)\""
| where action="BLOCK" OR action="COUNT"
| stats count as occurrences, max(_time) as last_ts,
        values(rule_id) as rule_ids,
        values(uri) as uris
        by action, rule_group
| eval last_seen=strftime(last_ts,"%Y-%m-%d %H:%M:%S") | fields - last_ts
| sort -occurrences
```

### `spl-infra-cdn.spl`

```spl
-- Mode F / CDN: CloudFront error and latency analysis
-- Placeholders: __HOST__, __URI_FILTER__, __HOURS__

search index=dx_ams_aws_cf host="__HOST__" earliest=__EARLIEST__ latest=__LATEST__
| search "__URI_FILTER__"
| rex field=_raw "(?<status>\d{3})\s+\S+\s+(?<cache_status>Hit|Miss|Error|Bypass)\s+\S+\s+(?<origin_ms>\d+)"
| where status>=400
| stats count as occurrences,
        avg(origin_ms) as avg_origin_ms,
        max(origin_ms) as max_origin_ms,
        max(_time) as last_ts
        by status, cache_status
| eval last_seen=strftime(last_ts,"%Y-%m-%d %H:%M:%S") | fields - last_ts
| sort -occurrences
```

### `spl-infra-elb.spl`

```spl
-- Mode F / ELB: Backend 5xx and target health analysis
-- Placeholders: __HOST__, __URI_FILTER__, __HOURS__
-- Covers both ALB (sourcetype=aws:alb:accesslogs) and
-- classic ELB (sourcetype=aws:elb:accesslogs)

search index IN ("ams_aws_elb_access","aws_elb_access") host="__HOST__" earliest=__EARLIEST__ latest=__LATEST__
  (sourcetype="aws:alb:accesslogs" OR sourcetype="aws:elb:accesslogs")
| search "__URI_FILTER__"
| rex field=_raw "(?<backend_status>\d{3})\s+(?<backend_ms>[\d.]+)\s+(?<target_ip>[\d.]+):(?<target_port>\d+)"
| where backend_status>=400
| stats count as occurrences,
        avg(backend_ms) as avg_backend_ms,
        values(target_ip) as target_ips,
        max(_time) as last_ts
        by backend_status
| eval last_seen=strftime(last_ts,"%Y-%m-%d %H:%M:%S") | fields - last_ts
| sort -occurrences
```

### `splunk-runner-infra.py`

Same structure as `splunk-runner.py`. Accepts `__HOURS__` (integer) as input — converts to absolute ISO `earliest_time` / `latest_time` internally before creating the Splunk job. This gives precise timestamps for cross-layer correlation (two queries for the same `--hours 24` will use the same absolute window). The SPL files use `earliest=__EARLIEST__ latest=__LATEST__` placeholders (substituted by the runner with ISO strings) rather than the relative `-__HOURS__h` syntax used in the existing SPL files.

---

## Implementation Testing

Each SPL file must be validated live against `splunk-api.or1.adobe.net` during implementation:

1. Run a count probe on each index with `host="*"` to confirm index is accessible
2. Run each full SPL with `__URI_FILTER__="*"` and `__HOURS__=24` to confirm field extraction works
3. Capture sample output and verify all extracted fields (`action`, `rule_id`, `status`, `cache_status`, `backend_status`, etc.) are non-null
4. Document any field name corrections needed based on actual log format

If an index is inaccessible (VPN, permissions), note it in the skill's error handling table.

---

## Error Handling Additions (SKILL.md table)

| Situation | Action |
|---|---|
| Validation probe returns count=0 | Tell user, ask to adjust hostname pattern or time window |
| Index inaccessible (connection refused, permissions) | "Cannot reach `<INDEX>` — check VPN and Splunk permissions" |
| WAF/CDN/ELB host pattern unknown | Ask once; blank → use `"*"` with a slowness warning |
| All three infra layers return empty | Report back to ams_cq analysis; note "no infra signal found" |
| Mode E escalation: ams_cq has partial results + infra hit | Present both: AEM partial findings + infra root cause side-by-side |

---

## Non-Goals

- Frontend JS log ingestion into Splunk (separate future effort)
- Automated PR generation for WAF rule / CDN config / ELB changes (infra config, not code)
- ELK querying (bank-managed, not accessible)
