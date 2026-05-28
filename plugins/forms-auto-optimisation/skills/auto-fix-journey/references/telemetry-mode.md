---
name: telemetry-mode
description: Load when the user provides a bare form URL with no stack trace. Discovers backend API errors for the form via optel, lets the user pick one, then transitions into API Error mode.
type: reference
---

# Telemetry Mode

Triggered by a form page URL without any stack frame, API path, or Splunk keyword.

## Step 1 — Inputs

- `FORM_URL` — extracted from the user's message.
- `DATE_RANGE` — defaults to `<TODAY>:<TODAY>` from environment context. Never `Bash(date)`.

If the host is `localhost`, `aem.page`, `hlx.page`, or `aem.live`, tell the user telemetry is not available for non-production URLs and ask for a production URL.

## Step 2 — Query optel

```
Skill("optel-query", "For form URL <FORM_URL> on <DATE_RANGE>, return all backend API calls
that returned HTTP 4xx or 5xx. Include: api_path, http_status, error_message or response_body_sample,
count, pct_sessions_affected. Sort by count desc.")
```

Empty result → print `"No API errors found for <FORM_URL> on <DATE_RANGE>. Try a wider range or paste a stack trace / API path directly."` and exit.

## Step 3 — Present and pick

```
Backend API Errors — <FORM_URL> — <DATE_RANGE>
Total: <N> distinct error patterns

#  | API Path                  | Status | Error summary                   | Count | Sessions %
---|---------------------------|--------|---------------------------------|-------|-----------
1  | /baas/getCustomerStatus   | 500    | Missing JSON in response body   | 1 204 | 34 %
2  | /otp/validate             | 400    | ServiceException: invalid state |   87  |  4 %
```

Ask: **"Which API error(s) to fix? Enter number(s), comma-separated, or 'all':"**

For each selected entry set `API_PATH`, `HTTP_STATUS`, `ERROR_SUMMARY` and hand off to `references/api-error-mode.md` (which picks up from its Step 2 — Splunk query).
