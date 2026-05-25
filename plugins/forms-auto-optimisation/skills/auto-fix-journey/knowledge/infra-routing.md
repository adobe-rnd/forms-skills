---
name: infra-routing
description: HTTP status → Splunk index routing table and output format rules for Infrastructure Mode (Mode F) and Mode E auto-escalation in auto-fix-journey.
---

# HTTP Status → Layer Routing Table

Read this table in Mode F (Step F0) and Mode E (Step E5) to determine which Splunk index to query first.

| HTTP Status | Primary layer | Index | Secondary layer (if primary empty) |
|---|---|---|---|
| 400 | AEM app | `ams_cq` | WAF (`dx_ams_aws_waf`) |
| 401 | AEM app | `ams_cq` | — |
| 403 | WAF | `dx_ams_aws_waf` | AEM app (`ams_cq`) |
| 404 on API path | AEM app | `ams_cq` | CDN (`dx_ams_aws_cf`) |
| 404 on asset / JS file | CDN | `dx_ams_aws_cf` | AEM app (`ams_cq`) |
| 429 | WAF (rate limit) | `dx_ams_aws_waf` | — |
| 500 | AEM app | `ams_cq` | — |
| 502 | ELB | `ams_aws_elb_access` | AEM app (`ams_cq`) |
| 503 | ELB | `ams_aws_elb_access` | CDN (`dx_ams_aws_cf`) |
| 504 | ELB (timeout) | `ams_aws_elb_access` | CDN (`dx_ams_aws_cf`) |
| 520 | CDN (unknown error from origin) | `dx_ams_aws_cf` | — |
| 521 | CDN (origin connection refused) | `dx_ams_aws_cf` | ELB |
| 522 | CDN (connection timed out) | `dx_ams_aws_cf` | ELB |
| 523 | CDN (origin unreachable) | `dx_ams_aws_cf` | ELB |
| 524 | CDN (timeout — origin took too long) | `dx_ams_aws_cf` | ELB |

**Decision rules (in priority order):**

1. HTTP status code provided → use routing table above, query primary layer first
2. Specific layer named by user ("check WAF", "check ELB", etc.) → query that layer directly, skip routing table
3. No status code, no Java class in `ams_cq`, no layer named → correlate all three: WAF → ELB → CDN
4. Step E5 fires and HTTP_STATUS is unknown → default escalation order: ELB → WAF → CDN

---

# Index and Sourcetype Reference

| Layer | Index | Sourcetype(s) | SPL file |
|---|---|---|---|
| AEM app | `ams_cq` | (any) | existing `spl-mode-*.spl` |
| WAF | `dx_ams_aws_waf` | (JSON WAF logs) | `spl-infra-waf.spl` |
| CDN | `dx_ams_aws_cf` | (CloudFront access logs) | `spl-infra-cdn.spl` |
| ELB | `ams_aws_elb_access` OR `aws_elb_access` | `aws:alb:accesslogs` (ALB) / `aws:elb:accesslogs` (classic ELB) | `spl-infra-elb.spl` |

---

# Hostname Formats Per Layer

| Layer | Filter format | Examples | Notes |
|---|---|---|---|
| WAF | AWS WAF web ACL name or resource ARN | `hdfc-prod-waf*` | Usually contains env name |
| CDN | CloudFront distribution ID | `E1ABC2DEF3GHI*`, `*` | 13-char alphanumeric ID |
| ELB | ALB/ELB name | `hdfc-prod-alb*` | From AWS console Load Balancers |
| AEM | AEM publish host | `hdfc-prod-pub*` | Existing pattern, unchanged |

Blank / unknown → use `"*"` and warn user that the query may be slow on large indexes.

---

# Output Format Rules

## Single-layer result

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

## Correlated failure-chain result (ALL layers or Step E5)

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

Status symbols:
- `✅ clean` — layer queried, zero hits
- `❌ hit` — layer has matching errors, this is likely the break point
- `⚠️  silent` — layer returned zero logs (request never reached this layer)
- `⏭️  skipped` — layer not queried (routing table said not relevant for this status)

## Severity classification

| Label | Threshold |
|---|---|
| **systemic** | > 1 000 occurrences OR affects every request to the path |
| **recurring** | 100–1 000 occurrences, appears consistently |
| **sporadic** | < 100 occurrences, intermittent |

---

# Recommended Actions by Layer

Use these as the basis for the "Recommended action" field in the output.

| Layer | Pattern | Recommended action |
|---|---|---|
| WAF | BLOCK on rule group `AWSManagedRulesCommonRuleSet` | Review rule match pattern; add URI to WAF allowlist if request is legitimate |
| WAF | COUNT (not yet blocking, monitoring) | Investigate whether the matched rule should be escalated to BLOCK or suppressed |
| WAF | 429 rate limit | Check if traffic spike is legitimate; adjust rate-limit threshold or add IP allowlist |
| CDN | 4xx with cache_status=Error | Origin returned error to CloudFront; check AEM logs on origin for that URI |
| CDN | 4xx/5xx with cache_status=Miss | Origin unreachable or returning errors; check ELB and AEM instance health |
| CDN | High avg_origin_ms (> 5 000ms) | Latency at origin; check AEM instance load and FDM API response times |
| ELB | 502 with specific target_ip | That AEM instance is unhealthy; check instance logs and ALB target group health |
| ELB | 503 (no healthy targets) | All AEM instances are deregistered or failing health checks; check deployment status |
| ELB | 504 (timeout) | AEM is responding but too slowly; check long-running FDM operations or GC pauses |
