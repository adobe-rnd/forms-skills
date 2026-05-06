#!/usr/bin/env bash
# Eval: Parse Functions smoke test for create-function skill
# Verifies parse-functions.js can parse JSDoc annotations from sample functions.
#
# Usage: bash skills/create-function/eval/eval-parse-functions.sh

set -euo pipefail

EVAL_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "$EVAL_DIR/../../.." && pwd)"
FIXTURES="$EVAL_DIR/fixtures"
PASS=0; FAIL=0; SKIP=0; TOTAL=0

pass() { PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); echo "  ❌ $1: $2"; }
skip() { SKIP=$((SKIP + 1)); TOTAL=$((TOTAL + 1)); echo "  ⏭️  $1 (skipped: $2)"; }

TMPDIR_EVAL="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_EVAL"' EXIT

echo "Parse Functions Eval"
echo "====================="

# ── Prerequisites ──

HAS_NODE=false
if command -v node &>/dev/null; then
  pass "Node.js available ($(node --version))"
  HAS_NODE=true
else
  skip "Node.js" "node not found in PATH"
fi

HAS_BRIDGE_MODULES=false
if [[ -d "$PLUGIN_ROOT/scripts/rule_coder/bridge/node_modules" ]]; then
  pass "Bridge node_modules installed"
  HAS_BRIDGE_MODULES=true
else
  skip "Bridge node_modules" "not installed — run: cd scripts/rule_coder/bridge && npm install"
fi

FIXTURE_FUNCTIONS="$FIXTURES/sample-functions.js"
if [[ ! -f "$FIXTURE_FUNCTIONS" ]]; then
  echo "FATAL: Required fixture missing: $FIXTURE_FUNCTIONS"
  exit 1
fi

# ── Parse Functions ──

echo ""
echo "── Parse Functions (parse-functions.js) ──"

if [[ "$HAS_NODE" == true && "$HAS_BRIDGE_MODULES" == true ]]; then
  STDOUT_FILE="$TMPDIR_EVAL/parse_functions_stdout.txt"
  STDERR_FILE="$TMPDIR_EVAL/parse_functions_stderr.txt"

  EXIT_CODE=0
  node "$PLUGIN_ROOT/scripts/rule_coder/bridge/cli/parse-functions.js" "$FIXTURE_FUNCTIONS" \
    >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

  if [[ "$EXIT_CODE" -eq 0 ]]; then
    pass "parse-functions.js exits with code 0"
  else
    fail "parse-functions.js exit code $EXIT_CODE" "$(head -5 "$STDERR_FILE")"
  fi

  if grep -q '"success"' "$STDOUT_FILE" 2>/dev/null && grep -q '"customFunction"' "$STDOUT_FILE" 2>/dev/null; then
    pass "parse-functions.js output contains \"success\" and \"customFunction\""
  else
    fail "parse-functions.js output missing expected keys" "$(head -5 "$STDOUT_FILE")"
  fi
else
  skip "parse-functions.js" "prerequisites not met"
fi

# ── Summary ──

echo ""
echo "════════════════════════════════"
echo "  $PASS passed, $FAIL failed, $SKIP skipped ($TOTAL total)"
echo "════════════════════════════════"
[[ "$FAIL" -gt 0 ]] && exit 1 || exit 0
