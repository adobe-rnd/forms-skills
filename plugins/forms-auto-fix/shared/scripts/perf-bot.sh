#!/usr/bin/env bash
# perf-bot.sh
#
# Install + run the performance-bot CLI against a repo's dirty working tree.
# The CLI lives at ${HOME}/.performance-bot/index.js after first install
# (the canonical location — usable by anything, not just this skill).
#
# Usage:
#   bash shared/scripts/perf-bot.sh --mode install
#   bash shared/scripts/perf-bot.sh --mode run --repo /abs/path/to/repo
#
# Output (last stdout line is JSON):
#   {"mode":"install|run","installed":bool,"report":"<path>","violations":<n>,"error":"<reason>|null"}
#
# The report path is "<repo>/.perf-bot-report.md". Also auto-appends that path
# to <repo>/.gitignore on first run so it never gets committed.

set -uo pipefail

MODE=""
REPO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    *) shift ;;
  esac
done

PB_DIR="${HOME}/.performance-bot"
PB_ENTRY="${PB_DIR}/index.js"
TARBALL_URL="https://github.com/adobe-aem-forms/performance-bot/releases/latest/download/performance-bot-cli.tar.gz"

log() { echo "[perf-bot] $*" >&2; }

install_cli() {
  if [ -f "$PB_ENTRY" ]; then
    log "already installed at $PB_ENTRY"
    return 0
  fi
  mkdir -p "$PB_DIR"
  log "downloading from $TARBALL_URL"
  if curl -fsSL "$TARBALL_URL" 2>/tmp/perf-bot-curl-stderr.txt | tar -xz -C "$PB_DIR" 2>>/tmp/perf-bot-curl-stderr.txt; then
    if [ ! -f "$PB_ENTRY" ]; then
      # Find a nested index.js if the tarball had a top-level dir
      FOUND=$(find "$PB_DIR" -maxdepth 3 -name index.js 2>/dev/null | head -1)
      [ -n "$FOUND" ] && PB_ENTRY="$FOUND"
    fi
    [ -f "$PB_ENTRY" ] && return 0
  fi
  log "install failed: $(head -2 /tmp/perf-bot-curl-stderr.txt)"
  return 1
}

case "$MODE" in
  install)
    if install_cli; then
      printf '{"mode":"install","installed":true,"entry":"%s","error":null}\n' "$PB_ENTRY"
    else
      printf '{"mode":"install","installed":false,"error":"install failed — see /tmp/perf-bot-curl-stderr.txt"}\n'
    fi
    ;;
  run)
    if [ -z "$REPO" ] || [ ! -d "$REPO" ]; then
      printf '{"mode":"run","error":"missing or invalid --repo"}\n'
      exit 0
    fi
    NODE_MAJOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)
    if [ "${NODE_MAJOR:-0}" -lt 20 ]; then
      printf '{"mode":"run","error":"Node 20+ required (have %s)"}\n' "$NODE_MAJOR"
      exit 0
    fi
    install_cli || { printf '{"mode":"run","error":"CLI install failed"}\n'; exit 0; }

    REPORT="${REPO}/.perf-bot-report.md"
    if ! grep -qxF '.perf-bot-report.md' "${REPO}/.gitignore" 2>/dev/null; then
      printf '\n.perf-bot-report.md\n' >> "${REPO}/.gitignore"
      log "appended .perf-bot-report.md to .gitignore"
    fi

    rm -f "$REPORT"
    ( cd "$REPO" && node "$PB_ENTRY" --diff HEAD --output ./.perf-bot-report.md ) \
      >/tmp/perf-bot-run-stdout.txt 2>/tmp/perf-bot-run-stderr.txt

    if [ ! -s "$REPORT" ]; then
      printf '{"mode":"run","installed":true,"report":"%s","violations":0,"error":"report missing or empty"}\n' "$REPORT"
      exit 0
    fi

    V=$(grep -c '^  - ⚠' "$REPORT" 2>/dev/null || echo 0)
    printf '{"mode":"run","installed":true,"report":"%s","violations":%s,"error":null}\n' "$REPORT" "$V"
    ;;
  *)
    printf '{"error":"unknown --mode (expected install|run)"}\n'
    ;;
esac
