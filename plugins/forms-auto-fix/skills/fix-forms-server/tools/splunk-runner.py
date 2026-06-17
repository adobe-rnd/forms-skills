# Splunk query runner — Modes A, B, C
#
# Substitute before writing to /tmp/fji_query.py:
#   __SPL__   — full SPL query body (read from spl-mode-*.spl; resolve its placeholders first)
#   __HOURS__ — integer hours to look back (= DAYS * 24)
#
# Run as:
#   SPLUNK_PASS="<pass>" python3 /tmp/fji_query.py 2>/dev/null

import sys, json, logging, os
from datetime import datetime, timedelta, timezone
logging.disable(logging.CRITICAL)  # suppress splunklib's verbose INFO output

SPLUNK_HOST   = os.getenv("SPLUNK_HOST",   "splunk-api.or1.adobe.net")
SPLUNK_USER   = os.getenv("SPLUNK_USER",   "api_aem_forms")
SPLUNK_PASS   = os.getenv("SPLUNK_PASS",   "")
SPLUNK_PORT   = int(os.getenv("SPLUNK_PORT",   "443"))   # standard HTTPS
SPLUNK_SCHEME = os.getenv("SPLUNK_SCHEME", "https")

try:
    from splunklib import client as splunk_client, results as sr
except ImportError:
    print(json.dumps({"error": "ImportError", "message": "splunklib not installed — run: pip install splunk-sdk"}))
    sys.exit(1)

try:
    svc = splunk_client.connect(
        host=SPLUNK_HOST, port=SPLUNK_PORT,
        username=SPLUNK_USER, password=SPLUNK_PASS,
        scheme=SPLUNK_SCHEME, autologin=True
    )

    end   = datetime.now(timezone.utc)
    start = end - timedelta(hours=__HOURS__)

    def run(spl):
        job = svc.jobs.create(
            spl,
            earliest_time=str(int(start.timestamp())),
            latest_time=str(int(end.timestamp())),
            exec_mode='blocking'
        )
        # count=0 means return all rows — no server-side row cap
        rows = [dict(r) for r in sr.JSONResultsReader(job.results(output_mode='json', count=0))
                if isinstance(r, dict)]
        job.cancel()  # free artifact immediately — avoids role-wide 5GB quota exhaustion
        return rows

    print(json.dumps(run("""__SPL__"""), indent=2, default=str))

except Exception as e:
    print(json.dumps({"error": type(e).__name__, "message": str(e)}))
    sys.exit(1)
