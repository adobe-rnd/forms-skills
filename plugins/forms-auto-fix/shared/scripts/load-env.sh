#!/usr/bin/env bash
# load-env.sh
#
# Source ${HOME}/form-auto-fix/.env (if present) into the caller shell and
# report which required variables are still missing. Required vars are
# passed via --require:
#
#   eval "$(bash shared/scripts/load-env.sh --require SPLUNK_PASS,GITHUB_TOKEN)"
#
# Output (last stdout line is JSON):
#   {"loaded": true|false, "missing": ["SPLUNK_PASS", ...]}
#
# When a required var is set, the script emits an `export VAR=...` line so
# the caller picks it up via `eval`. Diagnostics go to stderr. Never prompts.

set -euo pipefail

REQUIRE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --require) REQUIRE="$2"; shift 2 ;;
    *) shift ;;
  esac
done

ROOT="${HOME}/form-auto-fix"
ENV_FILE="${ROOT}/.env"
LOADED="false"
MISSING=()

if [ -f "$ENV_FILE" ]; then
  # Source in a subshell so we can re-export only the variables that exist
  # without clobbering the caller's existing env on parse failure.
  # shellcheck disable=SC1090
  set -a
  . "$ENV_FILE"
  set +a
  LOADED="true"
fi

# Always re-export common keys if set, so the caller can `eval` once.
for KEY in SPLUNK_PASS SPLUNK_USER SPLUNK_HOST GITHUB_TOKEN GHE_ADOBE_TOKEN HDFC_FORMS_TOKEN IA_WORKSPACE; do
  VAL="${!KEY:-}"
  if [ -n "$VAL" ]; then
    printf 'export %s=%q\n' "$KEY" "$VAL"
  fi
done

# Check requirements
if [ -n "$REQUIRE" ]; then
  IFS=',' read -ra REQS <<<"$REQUIRE"
  for KEY in "${REQS[@]}"; do
    KEY="${KEY// /}"
    VAL="${!KEY:-}"
    [ -z "$VAL" ] && MISSING+=("$KEY")
  done
fi

# Emit JSON as a comment line on stdout so it doesn't break `eval`.
if [ ${#MISSING[@]} -eq 0 ]; then
  printf '# {"loaded":%s,"missing":[]}\n' "$LOADED"
else
  M=$(printf '"%s",' "${MISSING[@]}" | sed 's/,$//')
  printf '# {"loaded":%s,"missing":[%s]}\n' "$LOADED" "$M"
fi
