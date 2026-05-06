#!/usr/bin/env bash
# Eval: API Manager smoke test for manage-apis skill
# Verifies api_manager CLI can be invoked and responds to --help.
#
# Usage: bash skills/manage-apis/eval/eval-api-manager.sh

set -euo pipefail

EVAL_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "$EVAL_DIR/../../.." && pwd)"
PASS=0; FAIL=0; SKIP=0; TOTAL=0

pass() { PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); echo "  ❌ $1: $2"; }
skip() { SKIP=$((SKIP + 1)); TOTAL=$((TOTAL + 1)); echo "  ⏭️  $1 (skipped: $2)"; }

TMPDIR_EVAL="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_EVAL"' EXIT

echo "API Manager Eval"
echo "================="

# ── Prerequisites ──

HAS_PYTHON=false
if command -v python3 &>/dev/null; then
  pass "Python 3 available ($(python3 --version))"
  HAS_PYTHON=true
else
  skip "Python 3" "python3 not found in PATH"
fi

# ── API Manager --help ──

echo ""
echo "── API Manager (--help) ──"

if [[ "$HAS_PYTHON" == true ]]; then
  STDOUT_FILE="$TMPDIR_EVAL/api_manager_stdout.txt"
  STDERR_FILE="$TMPDIR_EVAL/api_manager_stderr.txt"

  CLICK_CHECK=0
  python3 -c "import click" 2>/dev/null || CLICK_CHECK=$?

  if [[ "$CLICK_CHECK" -ne 0 ]]; then
    skip "api_manager --help" "click package not installed"
  else
    EXIT_CODE=0
    PYTHONPATH="$PLUGIN_ROOT/scripts" python3 -m api_manager.cli --help \
      >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

    if [[ "$EXIT_CODE" -eq 0 ]]; then
      pass "api_manager --help exits with code 0"
    else
      fail "api_manager --help exit code $EXIT_CODE" "$(head -5 "$STDERR_FILE")"
    fi

    if grep -qi "api manager\|api-manager\|manage api" "$STDOUT_FILE" 2>/dev/null; then
      pass "api_manager --help output contains API Manager reference"
    else
      fail "api_manager --help output missing API Manager reference" "$(head -5 "$STDOUT_FILE")"
    fi
  fi
else
  skip "api_manager --help" "Python 3 not available"
fi

# ── Summary ──

echo ""
echo "════════════════════════════════"
echo "  $PASS passed, $FAIL failed, $SKIP skipped ($TOTAL total)"
echo "════════════════════════════════"
[[ "$FAIL" -gt 0 ]] && exit 1 || exit 0
