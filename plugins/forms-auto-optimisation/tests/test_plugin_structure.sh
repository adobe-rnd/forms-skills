#!/usr/bin/env bash
# Plugin Structure Integration Test
# Validates that the forms-auto-optimisation plugin has all required files and references.
# Run from: forms-skills/plugins/forms-auto-optimisation/
#
# Usage: bash tests/test_plugin_structure.sh

set -euo pipefail

PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
TOTAL=0

pass() { PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); echo "  ❌ $1"; }
section() { echo ""; echo "── $1 ──"; }

cd "$PLUGIN_ROOT"

echo "Plugin Structure Integration Test"
echo "================================="
echo "Plugin root: $PLUGIN_ROOT"

# ── Plugin Metadata ──

section "Plugin Metadata"

if [[ -f ".claude-plugin/plugin.json" ]]; then
  pass "plugin.json exists"
else
  fail "plugin.json missing at .claude-plugin/plugin.json"
fi

if grep -q '"name": "forms-auto-optimisation"' ".claude-plugin/plugin.json" 2>/dev/null; then
  pass "plugin.json contains name \"forms-auto-optimisation\""
else
  fail "plugin.json does not contain name \"forms-auto-optimisation\""
fi

if grep -q '"skills"' ".claude-plugin/plugin.json" 2>/dev/null; then
  pass "plugin.json contains \"skills\" array"
else
  fail "plugin.json does not contain \"skills\" array"
fi

# ── Marketplace Registration ──

section "Marketplace Registration"

MARKETPLACE="$PLUGIN_ROOT/../../.claude-plugin/marketplace.json"
if [[ -f "$MARKETPLACE" ]]; then
  pass "marketplace.json exists at repo root"
else
  fail "marketplace.json missing at repo root (.claude-plugin/marketplace.json)"
fi

if grep -q '"forms-auto-optimisation"' "$MARKETPLACE" 2>/dev/null; then
  pass "marketplace.json contains \"forms-auto-optimisation\" entry"
else
  fail "marketplace.json does not contain \"forms-auto-optimisation\" entry"
fi

# ── Directory Structure ──

section "Directory Structure"

for dir in "skills" "agents" "hooks" "tests"; do
  if [[ -d "$dir" ]]; then
    pass "$dir/ exists"
  else
    fail "$dir/ missing"
  fi
done

if [[ -f "README.md" ]]; then
  pass "README.md exists"
else
  fail "README.md missing"
fi

# ── Summary ──

echo ""
echo "════════════════════════════════"
echo "  $PASS/$TOTAL tests passed, $FAIL failed"
echo "════════════════════════════════"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
else
  echo ""
  echo "All checks passed ✅"
  exit 0
fi
