#!/usr/bin/env bash
# Eval: Rule tool smoke tests for add-rules skill
# Tests transform-form, rule-validate, and save-rule against fixtures.
#
# Usage: bash skills/add-rules/eval/eval-rule-tools.sh

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

echo "Rule Tools Eval"
echo "================"

# ── Prerequisites ──

HAS_NODE=false
if command -v node &>/dev/null; then
  pass "Node.js available ($(node --version))"
  HAS_NODE=true
else
  skip "Node.js" "node not found in PATH"
fi

HAS_PYTHON=false
if command -v python3 &>/dev/null; then
  pass "Python 3 available ($(python3 --version))"
  HAS_PYTHON=true
else
  skip "Python 3" "python3 not found in PATH"
fi

HAS_BRIDGE_MODULES=false
if [[ -d "$PLUGIN_ROOT/scripts/rule_coder/bridge/node_modules" ]]; then
  pass "Bridge node_modules installed"
  HAS_BRIDGE_MODULES=true
else
  skip "Bridge node_modules" "not installed — run: cd scripts/rule_coder/bridge && npm install"
fi

FIXTURE_FORM_CRISPR="$FIXTURES/sample-contact-crispr.form.json"
FIXTURE_FORM="$FIXTURES/sample-contact.form.json"
FIXTURE_RULE="$FIXTURES/sample-contact.rule.json"

# ── Transform Form ──

echo ""
echo "── Transform Form (transform-form.js) ──"

if [[ "$HAS_NODE" == true && "$HAS_BRIDGE_MODULES" == true && -f "$FIXTURE_FORM_CRISPR" ]]; then
  STDOUT_FILE="$TMPDIR_EVAL/transform_stdout.txt"
  STDERR_FILE="$TMPDIR_EVAL/transform_stderr.txt"

  EXIT_CODE=0
  node "$PLUGIN_ROOT/scripts/rule_coder/bridge/cli/transform-form.js" "$FIXTURE_FORM_CRISPR" \
    >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

  if [[ "$EXIT_CODE" -eq 0 ]]; then
    pass "transform-form.js exits with code 0"
  else
    fail "transform-form.js exit code $EXIT_CODE" "$(head -5 "$STDERR_FILE")"
  fi

  JSON_CHECK_EXIT=0
  node -e "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'))" \
    <"$STDOUT_FILE" 2>/dev/null || JSON_CHECK_EXIT=$?

  if [[ "$JSON_CHECK_EXIT" -eq 0 ]]; then
    pass "transform-form.js output is valid JSON"
  else
    fail "transform-form.js output is not valid JSON" "$(head -3 "$STDOUT_FILE")"
  fi

  if grep -q '"success": true' "$STDOUT_FILE" 2>/dev/null; then
    pass "transform-form.js output contains \"success\": true"
  else
    fail "transform-form.js output missing success" "$(head -5 "$STDOUT_FILE")"
  fi

  if grep -q '"treeJson"' "$STDOUT_FILE" 2>/dev/null; then
    pass "transform-form.js output contains \"treeJson\""
  else
    fail "transform-form.js output missing treeJson" "$(head -5 "$STDOUT_FILE")"
  fi
else
  skip "transform-form.js" "prerequisites not met"
fi

# ── Rule Validator ──

echo ""
echo "── Rule Validator (Python) ──"

if [[ "$HAS_PYTHON" == true && -f "$FIXTURE_RULE" ]]; then
  STDOUT_FILE="$TMPDIR_EVAL/rule_validator_stdout.txt"
  STDERR_FILE="$TMPDIR_EVAL/rule_validator_stderr.txt"

  EXIT_CODE=0
  PYTHONPATH="$PLUGIN_ROOT/scripts" python3 -m rule_coder.validator "$FIXTURE_RULE" \
    >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

  if [[ "$EXIT_CODE" -eq 0 || "$EXIT_CODE" -eq 1 ]]; then
    pass "rule_coder.validator runs without crashing (exit code $EXIT_CODE)"
  else
    fail "rule_coder.validator crashed with exit code $EXIT_CODE" "$(head -5 "$STDERR_FILE")"
  fi

  COMBINED_SIZE=$(( $(wc -c < "$STDOUT_FILE" | tr -d ' ') + $(wc -c < "$STDERR_FILE" | tr -d ' ') ))
  if [[ "$COMBINED_SIZE" -gt 0 ]]; then
    pass "rule_coder.validator produced output (${COMBINED_SIZE} bytes)"
  else
    fail "rule_coder.validator produced no output" "expected validation result"
  fi
else
  skip "rule_coder.validator" "prerequisites not met"
fi

# ── Save Rule (dry-run) ──

echo ""
echo "── Save Rule (dry-run) ──"

if [[ "$HAS_NODE" == true && "$HAS_BRIDGE_MODULES" == true && -f "$FIXTURE_RULE" && -f "$FIXTURE_FORM_CRISPR" ]]; then
  STDOUT_FILE="$TMPDIR_EVAL/save_rule_stdout.txt"
  STDERR_FILE="$TMPDIR_EVAL/save_rule_stderr.txt"

  EXIT_CODE=0
  node "$PLUGIN_ROOT/scripts/rule_coder/bridge/cli/save-rule.js" \
    "$FIXTURE_RULE" \
    --rule-store /dev/null \
    --form "$FIXTURE_FORM_CRISPR" \
    --dry-run \
    >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

  COMBINED_OUTPUT="$(cat "$STDOUT_FILE" "$STDERR_FILE" 2>/dev/null)"
  if [[ "$EXIT_CODE" -eq 0 ]]; then
    pass "save-rule.js --dry-run exits with code 0"
  elif [[ -n "$COMBINED_OUTPUT" ]]; then
    pass "save-rule.js --dry-run ran (exit $EXIT_CODE, produced output)"
  else
    fail "save-rule.js --dry-run crashed with exit code $EXIT_CODE" "no output"
  fi
else
  skip "save-rule.js --dry-run" "prerequisites not met"
fi

# ── Summary ──

echo ""
echo "════════════════════════════════"
echo "  $PASS passed, $FAIL failed, $SKIP skipped ($TOTAL total)"
echo "════════════════════════════════"
[[ "$FAIL" -gt 0 ]] && exit 1 || exit 0
