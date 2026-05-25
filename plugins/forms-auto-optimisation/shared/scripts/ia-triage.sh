#!/usr/bin/env bash
# ia-triage.sh
#
# Run `ia triage` for a single error. Handles the two AEM-clientlib failure
# modes documented in shared/references/ia-glossary.md:
#   1. minified clientlib URL → source path rewrite
#   2. bare JS function name as --symbol always unresolved → SQLite JsFunction
#      lookup → file-suffix triage
#
# Usage:
#   bash shared/scripts/ia-triage.sh \
#       --type TypeError \
#       --message "fdPanel.forEach is not a function" \
#       --file-url "https://.../etc.clientlibs/HDFC_PLForms/clientlibs/foo.min.ACSHASH123.js" \
#       --line 59 \
#       --col 12 \
#       --symbol fdPanelForEach \
#       --out /tmp/ia-triage-1.json
#
# Requires IA_CMD and IA_GRAPH to be set in the environment (run resolve-ia.sh first).
# Writes the triage JSON to --out and prints a one-line JSON summary on stdout.

set -uo pipefail

TYPE=""
MESSAGE=""
FILE_URL=""
LINE=""
COL=""
SYMBOL=""
OUT="/tmp/ia-triage-out.json"

while [ $# -gt 0 ]; do
  case "$1" in
    --type)     TYPE="$2";     shift 2 ;;
    --message)  MESSAGE="$2";  shift 2 ;;
    --file-url) FILE_URL="$2"; shift 2 ;;
    --line)     LINE="$2";     shift 2 ;;
    --col)      COL="$2";      shift 2 ;;
    --symbol)   SYMBOL="$2";   shift 2 ;;
    --out)      OUT="$2";      shift 2 ;;
    *) shift ;;
  esac
done

log() { echo "[ia-triage] $*" >&2; }

if [ -z "${IA_CMD:-}" ] || [ -z "${IA_GRAPH:-}" ]; then
  echo '{"empty":true,"reason":"IA_CMD or IA_GRAPH not set — run resolve-ia.sh first"}'
  exit 0
fi

# ── Step 1: rewrite minified clientlib URL → source path ────────────────────
RESOLVED="$FILE_URL"
CLIENTLIB_APP=""
CLIENTLIB_LIB=""
if [[ "$FILE_URL" =~ /etc\.clientlibs/([^/]+)/clientlibs/([^.]+)\.min\.ACSHASH[^.]+\.js ]]; then
  CLIENTLIB_APP="${BASH_REMATCH[1]}"
  CLIENTLIB_LIB="${BASH_REMATCH[2]}"
  RESOLVED="${CLIENTLIB_APP}/ui.apps/src/main/content/jcr_root/apps/${CLIENTLIB_APP}/clientlibs/${CLIENTLIB_LIB}/js/"
  log "rewrote minified URL → $RESOLVED"
fi

# ── Step 2: try SQLite JsFunction lookup when a symbol was provided ─────────
TRIAGE_SYMBOL=""
if [ -n "$SYMBOL" ] && [ -f "$IA_GRAPH" ]; then
  JS_NODE=$(sqlite3 "$IA_GRAPH" \
    "SELECT id FROM nodes WHERE id LIKE '%#${SYMBOL}' AND type='JsFunction' LIMIT 1;" \
    2>/dev/null || echo "")
  if [ -n "$JS_NODE" ]; then
    SRC_FILE="${JS_NODE%%#*}"
    TRIAGE_SYMBOL=$(echo "$SRC_FILE" | awk -F'/' '{print $(NF-2)"/"$(NF-1)"/"$NF}')
    log "SQLite hit — using file-suffix --symbol $TRIAGE_SYMBOL"
  fi
fi

# ── Step 3: run triage (symbol first, stack-trace fallback) ─────────────────
> "$OUT"
EXIT_CODE=1

if [ -n "$TRIAGE_SYMBOL" ]; then
  eval $IA_CMD triage \
    --graph "$IA_GRAPH" \
    --symbol "$TRIAGE_SYMBOL" \
    --format json \
    > "$OUT" 2>/tmp/ia-triage-stderr.txt
  EXIT_CODE=$?
fi

if [ $EXIT_CODE -ne 0 ] || [ ! -s "$OUT" ]; then
  STACK="/tmp/ia-triage-stack-$$.txt"
  printf '%s: %s\n  at %s:%s\n' "$TYPE" "$MESSAGE" "$RESOLVED" "$LINE" > "$STACK"
  eval $IA_CMD triage \
    --graph "$IA_GRAPH" \
    --stack-trace "$STACK" \
    --format json \
    > "$OUT" 2>/tmp/ia-triage-stderr.txt
  EXIT_CODE=$?
  rm -f "$STACK"
fi

if [ $EXIT_CODE -ne 0 ] || [ ! -s "$OUT" ]; then
  echo '{"empty":true,"reason":"triage produced no output","stderr":"'"$(head -2 /tmp/ia-triage-stderr.txt | tr -d '"')"'"}'
  exit 0
fi

# Summarise: pull out the first seed's repo/file/trail if present.
SUMMARY=$(node -e "
  try {
    const d = JSON.parse(require('fs').readFileSync('$OUT', 'utf8'));
    const s = (d.seeds && d.seeds[0]) || {};
    const id = s.id || '';
    const repo = id.split('/')[0] || '';
    const file = id.split('/').slice(1).join('/').split('#')[0] || '';
    const trail = (s.trail || s.path || []).join(' ← ') || '';
    process.stdout.write(JSON.stringify({
      empty: !d.seeds || d.seeds.length === 0,
      ia_repo: repo,
      ia_file: file,
      ia_trail: trail,
      out: '$OUT'
    }));
  } catch (e) {
    process.stdout.write(JSON.stringify({empty: true, reason: 'parse error: ' + e.message}));
  }
" 2>/dev/null)

echo "$SUMMARY"
