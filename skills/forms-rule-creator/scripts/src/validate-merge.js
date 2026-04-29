#!/usr/bin/env node
// Validates the merged { fd:rules, fd:events } object produced in Step 11 of forms-rule-creator.
//
// Enforces correct routing of compiled content per SKILL.md line 150:
//   Expression rules (fd:visible, fd:calc, fd:validate, fd:enabled, fd:format):
//     - fd:rules["fd:<key>"] = [stringified_ast]   ← raw AST for rule editor
//     - fd:rules["<key>"]    = "<formula_string>"  ← compiled formula for runtime
//     - fd:events            must NOT have "<key>"
//
//   Event rules (fd:change, fd:click, fd:init, ...):
//     - fd:rules["fd:<key>"] = [stringified_ast]   ← raw AST for rule editor ONLY
//     - fd:rules["<key>"]    must NOT exist        ← no compiled content here
//     - fd:events["<key>"]   = ["<script>", ...]   ← compiled scripts for runtime
//
// The most common mistake (caught by this validator): generate-formula Format 1 output
// puts event script content in fdRules["fd:change"].content — the LLM must route it to
// fd:events["change"], not copy it into fd:rules["change"].
//
// Usage:
//   node validate-merge.bundle.js <merged-rule.json>
//
// Output (valid):
//   { valid: true, errors: [], warnings: [] }
//
// Output (invalid):
//   { valid: false, errors: [...], warnings: [] }
//
// Exit codes:
//   0  valid
//   1  invalid or error

import { readFileSync } from 'fs';

// All fd:* expression keys — compiled formula stays in fd:rules
const EXPRESSION_KEYS = new Set(['visible', 'calc', 'validate', 'enabled', 'format']);

// All fd:* event keys — compiled scripts must go in fd:events (source: agent-kb/05)
const EVENT_KEYS = new Set([
  'change', 'click', 'init', 'initialize',
  'focus', 'blur', 'valid', 'invalid',
  'submit', 'submitSuccess', 'submitError', 'submitFailure', // submitFailure deprecated but still valid
  'save', 'reset',
  'addInstance', 'removeInstance',
  'addItem', 'removeItem',
  'error', 'load',
  'valueCommit', // legacy key — maps to fd:events (same routing as change)
]);

function validateMerge(merged) {
  const errors = [];
  const warnings = [];

  const fdRules  = (merged && merged['fd:rules'])  || {};
  const fdEvents = (merged && merged['fd:events']) || {};

  // ── Checks on fd:rules entries ──────────────────────────────────────────────

  const fdPrefixedKeys = Object.keys(fdRules).filter(k => k.startsWith('fd:'));

  for (const fdKey of fdPrefixedKeys) {
    const bareKey     = fdKey.slice(3); // strip "fd:"
    const isExpr      = EXPRESSION_KEYS.has(bareKey);
    const isEvent     = EVENT_KEYS.has(bareKey);
    const rawAstValue = fdRules[fdKey];

    // Check 7 — unknown fd:* key (warning, not error)
    if (!isExpr && !isEvent) {
      warnings.push({
        code:    'UNKNOWN_FD_KEY',
        message: `Unknown fd:* key '${fdKey}' in fd:rules — not in known expression or event key lists`,
        path:    `fd:rules["${fdKey}"]`,
      });
      continue;
    }

    // Check 1 — fd:<key> must be a non-empty array containing the stringified AST
    if (!Array.isArray(rawAstValue) || rawAstValue.length === 0 || typeof rawAstValue[0] !== 'string') {
      errors.push({
        code:    'FD_KEY_NOT_ARRAY',
        message: `fd:rules["${fdKey}"] must be a non-empty array containing the stringified rule AST`,
        path:    `fd:rules["${fdKey}"]`,
        fix:     `Set fd:rules["${fdKey}"] = [JSON.stringify(ruleAst)]`,
      });
    }

    // ── Expression rule checks ────────────────────────────────────────────────
    if (isExpr) {
      const bareVal = fdRules[bareKey];

      // Check 2 — bare key must exist in fd:rules as a non-empty string
      if (!(bareKey in fdRules) || !bareVal) {
        errors.push({
          code:    'EXPRESSION_BARE_KEY_MISSING',
          message: `Expression rule '${bareKey}': compiled formula missing — fd:rules["${bareKey}"] must be a non-empty string`,
          path:    `fd:rules["${bareKey}"]`,
          fix:     `Set fd:rules["${bareKey}"] = fdRules["${fdKey}"].content from generate-formula output (must be a string, not an array)`,
        });
      // Check 3 — bare key must be a plain string, not an array
      // (catches Format 1 content array copied directly instead of using content[0])
      } else if (Array.isArray(bareVal)) {
        errors.push({
          code:    'EXPRESSION_BARE_KEY_IS_ARRAY',
          message: `Expression rule '${bareKey}': fd:rules["${bareKey}"] is an array but must be a plain formula string`,
          path:    `fd:rules["${bareKey}"]`,
          fix:     `Use fdRules["${fdKey}"].content as a string — if generate-formula returned an array, use content[0]`,
        });
      }
    }

    // ── Event rule checks ─────────────────────────────────────────────────────
    if (isEvent) {
      // Check 4 — bare key must NOT appear in fd:rules
      if (bareKey in fdRules) {
        errors.push({
          code:    'EVENT_COMPILED_IN_FD_RULES',
          message: `Event rule '${bareKey}': compiled script must not be in fd:rules — remove fd:rules["${bareKey}"]`,
          path:    `fd:rules["${bareKey}"]`,
          fix:     `Remove fd:rules["${bareKey}"] and move that value to fd:events["${bareKey}"] — route fdRules["${fdKey}"].content to fd:events`,
        });
      }

      const eventsVal = fdEvents[bareKey];

      // Check 5 — fd:events must have the compiled script as a non-empty array
      if (!(bareKey in fdEvents) || !eventsVal) {
        errors.push({
          code:    'EVENT_MISSING_FROM_FD_EVENTS',
          message: `Event rule '${bareKey}': compiled script missing — fd:events["${bareKey}"] must be a non-empty array`,
          path:    `fd:events["${bareKey}"]`,
          fix:     `Set fd:events["${bareKey}"] = fdRules["${fdKey}"].content from generate-formula output (must be an array)`,
        });
      // Check 6 — fd:events value must be an array (not a raw string)
      } else if (!Array.isArray(eventsVal)) {
        errors.push({
          code:    'FD_EVENTS_VALUE_NOT_ARRAY',
          message: `fd:events["${bareKey}"] must be an array of scripts, not a ${typeof eventsVal}`,
          path:    `fd:events["${bareKey}"]`,
          fix:     `Wrap the value in an array: fd:events["${bareKey}"] = [value]`,
        });
      }

      // Deprecated key notice (informational warning)
      if (bareKey === 'submitFailure') {
        warnings.push({
          code:    'DEPRECATED_EVENT_KEY',
          message: `'submitFailure' is deprecated — prefer 'submitError' (agent-kb/05)`,
          path:    `fd:rules["${fdKey}"]`,
        });
      }
    }
  }

  // ── Orphaned bare keys in fd:rules (no matching fd:* entry) ─────────────────
  const bareKeysInFdRules = Object.keys(fdRules).filter(k => !k.startsWith('fd:'));
  for (const bareKey of bareKeysInFdRules) {
    if (!(`fd:${bareKey}` in fdRules)) {
      errors.push({
        code:    'ORPHANED_BARE_KEY',
        message: `fd:rules["${bareKey}"] has no corresponding "fd:${bareKey}" raw AST entry`,
        path:    `fd:rules["${bareKey}"]`,
        fix:     `Either add fd:rules["fd:${bareKey}"] = [JSON.stringify(ruleAst)], or remove the orphaned "${bareKey}" key`,
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

try {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    throw new Error('Usage: validate-merge.bundle.js <merged-rule.json>');
  }

  const merged = JSON.parse(readFileSync(args[0], 'utf8'));
  const result = validateMerge(merged);

  process.stdout.write(JSON.stringify(result) + '\n');
  process.exit(result.valid ? 0 : 1);
} catch (e) {
  process.stdout.write(JSON.stringify({ valid: false, errors: [{ code: 'CLI_ERROR', message: e.message }], warnings: [] }) + '\n');
  process.exit(1);
}
