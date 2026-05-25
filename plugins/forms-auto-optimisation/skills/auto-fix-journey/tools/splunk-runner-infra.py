# Splunk query runner — Infrastructure Mode (WAF / CDN / ELB)
#
# Substitute before writing to /tmp/fji_infra_<layer>.py:
#   __SPL__   — full SPL query body (read from spl-infra-*.spl; resolve its placeholders first)
#   __HOURS__ — integer hours to look back; runner converts to absolute ISO timestamps
#               so that parallel queries for the same run share the same time window.
#
# Run as:
#   SPLUNK_PASS="<pass>" python3 /tmp/fji_infra_<layer>.py 2>/dev/null
#
# Environment variables (all optional — defaults match AMS Splunk):
#   SPLUNK_HOST   — default: splunk-api.or1.adobe.net
#   SPLUNK_USER   — default: api_aem_forms
#   SPLUNK_PASS   — required: set via env, never hardcoded
#   SPLUNK_PORT   — default: 443
#   SPLUNK_SCHEME — default: https

import sys, json, logging, os
from datetime import datetime, timedelta, timezone
logging.disable(logging.CRITICAL)  # suppress splunklib verbose INFO output

SPLUNK_HOST   = os.getenv("SPLUNK_HOST",   "splunk-api.or1.adobe.net")
SPLUNK_USER   = os.getenv("SPLUNK_USER",   "api_aem_forms")
SPLUNK_PASS   = os.getenv("SPLUNK_PASS",   "")
SPLUNK_PORT   = int(os.getenv("SPLUNK_PORT",   "443"))
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

    # Convert __HOURS__ to absolute ISO window so parallel queries share the same boundary.
    # The SPL files use earliest=__EARLIEST__ latest=__LATEST__ placeholders which are
    # replaced below — Splunk's job.create() earliest_time/latest_time params take
    # precedence over any inline earliest= in the SPL.
    end   = datetime.now(timezone.utc)
    start = end - timedelta(hours=__HOURS__)

    EARLIEST = start.strftime('%Y-%m-%dT%H:%M:%S')
    LATEST   = end.strftime('%Y-%m-%dT%H:%M:%S')

    def run(spl):
        # Replace SPL-level placeholder timestamps (belt-and-suspenders alongside job params)
        spl = spl.replace("__EARLIEST__", EARLIEST).replace("__LATEST__", LATEST)
        job = svc.jobs.create(
            spl,
            earliest_time=EARLIEST,
            latest_time=LATEST,
            exec_mode='blocking'
        )
        # count=0 returns all rows — no server-side cap
        return [dict(r) for r in sr.JSONResultsReader(job.results(output_mode='json', count=0))
                if isinstance(r, dict)]

    print(json.dumps(run("""__SPL__"""), indent=2, default=str))

except Exception as e:
    print(json.dumps({"error": type(e).__name__, "message": str(e)}))
    sys.exit(1)
