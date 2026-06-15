---
name: api-error-mode
description: Load when the user provides an API path + 4xx/5xx status (or an error label like "High API Errors"). Queries Splunk to find the dominant throw site, then transitions to Fix mode.
type: reference
---

# API Error Mode

Triggered by a message containing an API path/route and a 400/500/"failing"/"error" reference.

## Step 1 — Inputs

- `API_PATH` — route or partial path (e.g. `/baas/getCustomerStatus`).
- `HTTP_STATUS` — 400, 500, or "both" if not specified.
- `HOST_FILTER` — default `hdfc-prod-pub*`.

Ask once only if `API_PATH` is missing.

## Step 2 — Splunk credentials

```bash
bash ../../shared/scripts/load-env.sh --require SPLUNK_PASS
```
If `SPLUNK_PASS` is in the `missing` list, ask the user once and offer to append it to `${HOME}/form-auto-fix/.env`.

`SPLUNK_HOST` defaults to `splunk-api.or1.adobe.net`, `SPLUNK_USER` defaults to `api_aem_forms`.

## Step 3 — Query Splunk (1 day, expand to 2 if sparse)

Read `tools/spl-mode-e.spl`. Substitute:

- `__HOST__` → `$HOST_FILTER`
- `__API_PATH__` → `$API_PATH`
- `__HOURS__` → `24`

Write to `/tmp/fji_api_error.py` using `tools/splunk-runner.py`. Run:

```bash
SPLUNK_PASS="$SPLUNK_PASS" python3 /tmp/fji_api_error.py 2>/dev/null
```

If total `occurrences` across all rows < 5: re-run with `__HOURS__=48`. If still < 5, ask the user whether to proceed or supply a different path.

## Step 4 — Display and classify

Show a ranked table (top 10 by count):

```
API Error Analysis — <API_PATH> — last <HOURS>h on <HOST>
Total error occurrences: <N>

#  | Class                           | Error summary                        | Count | Last seen
---|----------------------------------|--------------------------------------|-------|----------
1  | BaaSCustomerDetailsServiceImpl  | ServiceException: Journey state mis… |   142 | 2026-05-12 09:14
2  | OTPValidationServlet            | NullPointerException at line 631     |    38 | 2026-05-12 08:50
```

Below the table, add a structured analysis paragraph covering:

1. **Dominant thrower** — class with highest count and its share.
2. **Exception type** — recognisable Java exception or downstream API error code pattern.
3. **Stack trace availability** — full Java trace visible, or caught-and-logged without stack.
4. **Root cause confidence** — high / medium / low.
5. **Secondary issues** — other classes worth noting.

## Step 5 — Confidence gate → Fix mode or ask

**High confidence** — single class+exception > 60% of occurrences AND exception type is recognisable (NPE, ServiceException, ClassCastException):

→ Extract `EXCEPTION_TYPE`, `EXCEPTION_MESSAGE`, `SHORT_CLASS`, `LINE_NUMBER` from the top row. Print the transition banner and continue at **Fix mode Step 2** (IA triage).

**Medium / low confidence** — scattered classes, ambiguous exception, or purely downstream bank-API failures:

→ Do not auto-proceed. Print findings + analysis paragraph and ask the user to clarify (stack trace, journey ID, or which row to fix). Continue at **Fix mode Step 2** once they reply.

## Step 6 — Infrastructure escalation (Step E5)

Fires automatically when ANY of these is true after Steps 3–5:
- Step 3 returned zero rows for the API path in `ams_cq`
- Step 4 rows have no extractable Java class (pure HTTP log, no exception)
- `HTTP_STATUS` is known and `references/infra-routing.md` maps it to a non-`ams_cq` primary layer

```
Read references/infra-routing.md → look up HTTP_STATUS → primary layer
        ↓
Run validation probe: search index=<PRIMARY_INDEX> host="<HOST>" earliest=-24h | stats count
        ↓
count == 0 → ask user to confirm hostname/time window
count > 0  → query primary layer using spl-infra-<layer>.spl + splunk-runner-infra.py
        ↓
Results found?
  YES → present layer-specific root cause report (format in references/infra-routing.md), stop
  NO  → query secondary layer (per routing table)
        ↓
  Results found?
    YES → present report, stop
    NO  → correlate all three layers in sequence (WAF → ELB → CDN)
          → present unified failure-chain report
```

If `HTTP_STATUS` is not known, default escalation order: ELB → WAF → CDN.

**Hostname for infra layers** — host filter format differs per index. Ask per layer if not in message:
```
AskUserQuestion:
  Which host/resource filter for <WAF|CDN|ELB> logs?
  (Leave blank for "*" — may be slow on large indexes)
  Examples: hdfc-prod-waf* / E1ABC2* / hdfc-prod-alb*
```
