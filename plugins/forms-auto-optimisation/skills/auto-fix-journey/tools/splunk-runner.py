# Splunk query runner templates
#
# STANDARD template (Modes A / B / C)
# ------------------------------------
# Substitute before writing to /tmp/fji_query.py:
#   __SPL__    — SPL query body (from spl-mode-*.spl, with its own placeholders resolved first)
#   __HOURS__  — integer, hours to look back (DAYS * 24)
#
# Run as:
#   SPLUNK_PASS="<pass>" python3 /tmp/fji_query.py 2>/dev/null

import sys, json, logging, os
from datetime import datetime, timedelta, timezone
logging.disable(logging.CRITICAL)

SPLUNK_HOST   = os.getenv("SPLUNK_HOST",   "splunk-api.or1.adobe.net")
SPLUNK_USER   = os.getenv("SPLUNK_USER",   "api_aem_forms")
SPLUNK_PASS   = os.getenv("SPLUNK_PASS",   "")
SPLUNK_PORT   = int(os.getenv("SPLUNK_PORT",   "443"))
SPLUNK_SCHEME = os.getenv("SPLUNK_SCHEME", "https")

from splunklib import client as splunk_client, results as sr

svc = splunk_client.connect(
    host=SPLUNK_HOST, port=SPLUNK_PORT,
    username=SPLUNK_USER, password=SPLUNK_PASS,
    scheme=SPLUNK_SCHEME, autologin=True
)
end   = datetime.now(timezone.utc)
start = end - timedelta(hours=__HOURS__)

def run(spl):
    job = svc.jobs.create(spl,
        earliest_time=start.strftime('%Y-%m-%dT%H:%M:%S'),
        latest_time=end.strftime('%Y-%m-%dT%H:%M:%S'),
        exec_mode='blocking')
    return [dict(r) for r in sr.JSONResultsReader(job.results(output_mode='json', count=0))
            if isinstance(r, dict)]

print(json.dumps(run("""__SPL__"""), indent=2, default=str))


# ANALYTICS template (Mode D)
# ----------------------------
# Substitute before writing to /tmp/fji_analytics.py:
#   __SPL__        — SPL query body (from spl-mode-d.spl, with its own placeholders resolved first)
#   __DAYS__       — integer, days to look back (used when no explicit start/end dates)
#   __START_DATE__ — ISO date string "YYYY-MM-DD" OR the sentinel "USE_DAYS" to fall back to __DAYS__
#   __END_DATE__   — ISO date string "YYYY-MM-DD" OR the sentinel "USE_DAYS"
#
# Run as:
#   SPLUNK_PASS="<pass>" python3 /tmp/fji_analytics.py 2>/dev/null

import sys, json, logging, os
from datetime import datetime, timedelta, timezone
logging.disable(logging.CRITICAL)

SPLUNK_HOST   = os.getenv("SPLUNK_HOST",   "splunk-api.or1.adobe.net")
SPLUNK_USER   = os.getenv("SPLUNK_USER",   "api_aem_forms")
SPLUNK_PASS   = os.getenv("SPLUNK_PASS",   "")
SPLUNK_PORT   = int(os.getenv("SPLUNK_PORT",   "443"))
SPLUNK_SCHEME = os.getenv("SPLUNK_SCHEME", "https")

from splunklib import client as splunk_client, results as sr

svc = splunk_client.connect(
    host=SPLUNK_HOST, port=SPLUNK_PORT,
    username=SPLUNK_USER, password=SPLUNK_PASS,
    scheme=SPLUNK_SCHEME, autologin=True
)

_now = datetime.now(timezone.utc)
_start_raw = "__START_DATE__"
_end_raw   = "__END_DATE__"

if _start_raw == "USE_DAYS":
    start = _now - timedelta(days=__DAYS__)
    end   = _now
else:
    start = datetime.fromisoformat(_start_raw).replace(tzinfo=timezone.utc)
    end   = datetime.fromisoformat(_end_raw).replace(tzinfo=timezone.utc)

def run(spl):
    job = svc.jobs.create(spl,
        earliest_time=start.strftime('%Y-%m-%dT%H:%M:%S'),
        latest_time=end.strftime('%Y-%m-%dT%H:%M:%S'),
        exec_mode='blocking')
    return [dict(r) for r in sr.JSONResultsReader(job.results(output_mode='json', count=0))
            if isinstance(r, dict)]

print(json.dumps(run("""__SPL__"""), indent=2, default=str))
