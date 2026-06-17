#!/usr/bin/env bash
# resolve-workspace.sh
#
# Ensure ${HOME}/form-auto-fix/ exists with its conventional subtree, then
# emit eval-able exports + a JSON summary on stdout.
#
# Usage:
#   eval "$(bash shared/scripts/resolve-workspace.sh)"
#
# The workspace holds skill-specific artefacts only:
#   ${HOME}/form-auto-fix/
#     ├── .env            user-managed env vars (Splunk creds, tokens)
#     ├── <repo-name>/    auto-cloned target repos (shared by both skills)
#     └── runs/<slug>-<date>/   per-run outputs
#
# IA CLI / graph / config live at ${HOME}/.impact-analyser/ — see resolve-ia.sh.
# Performance-bot CLI lives at ${HOME}/.performance-bot/ — see perf-bot.sh.
#
# Diagnostics go to stderr. Never prompts.

set -euo pipefail

ROOT="${HOME}/form-auto-fix"
RUNS="${ROOT}/runs"
ENV_FILE="${ROOT}/.env"

mkdir -p "$RUNS" >/dev/null

ENV_EXISTS="false"
[ -f "$ENV_FILE" ] && ENV_EXISTS="true"

printf 'export FORM_AUTO_FIX_ROOT=%q\n' "$ROOT"
printf 'export FORM_AUTO_FIX_RUNS=%q\n' "$RUNS"
printf 'export FORM_AUTO_FIX_ENV=%q\n'  "$ENV_FILE"

printf '# %s\n' "{\"root\":\"$ROOT\",\"runs_dir\":\"$RUNS\",\"env_exists\":$ENV_EXISTS}"
