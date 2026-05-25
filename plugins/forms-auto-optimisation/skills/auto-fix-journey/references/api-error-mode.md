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

Run `bash shared/scripts/load-env.sh --require SPLUNK_PASS`. If `SPLUNK_PASS` is in the `missing` list, ask the user once and offer to append it to `${HOME}/form-auto-fix/.env`.

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
