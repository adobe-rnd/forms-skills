#!/usr/bin/env node
var __import_meta_url__ = require('url').pathToFileURL(__filename).href;

// scripts/src/validate-merge.js
var import_fs = require("fs");
var EXPRESSION_KEYS = /* @__PURE__ */ new Set(["visible", "calc", "validate", "enabled", "format"]);
var EVENT_KEYS = /* @__PURE__ */ new Set([
  "change",
  "click",
  "init",
  "initialize",
  "focus",
  "blur",
  "valid",
  "invalid",
  "submit",
  "submitSuccess",
  "submitError",
  "submitFailure",
  // submitFailure deprecated but still valid
  "save",
  "reset",
  "addInstance",
  "removeInstance",
  "addItem",
  "removeItem",
  "error",
  "load",
  "valueCommit"
  // legacy key — maps to fd:events (same routing as change)
]);
function validateMerge(merged) {
  const errors = [];
  const warnings = [];
  const fdRules = merged && merged["fd:rules"] || {};
  const fdEvents = merged && merged["fd:events"] || {};
  const fdPrefixedKeys = Object.keys(fdRules).filter((k) => k.startsWith("fd:"));
  for (const fdKey of fdPrefixedKeys) {
    const bareKey = fdKey.slice(3);
    const isExpr = EXPRESSION_KEYS.has(bareKey);
    const isEvent = EVENT_KEYS.has(bareKey);
    const rawAstValue = fdRules[fdKey];
    if (!isExpr && !isEvent) {
      warnings.push({
        code: "UNKNOWN_FD_KEY",
        message: `Unknown fd:* key '${fdKey}' in fd:rules \u2014 not in known expression or event key lists`,
        path: `fd:rules["${fdKey}"]`
      });
      continue;
    }
    if (!Array.isArray(rawAstValue) || rawAstValue.length === 0 || typeof rawAstValue[0] !== "string") {
      errors.push({
        code: "FD_KEY_NOT_ARRAY",
        message: `fd:rules["${fdKey}"] must be a non-empty array containing the stringified rule AST`,
        path: `fd:rules["${fdKey}"]`,
        fix: `Set fd:rules["${fdKey}"] = [JSON.stringify(ruleAst)]`
      });
    }
    if (isExpr) {
      const bareVal = fdRules[bareKey];
      if (!(bareKey in fdRules) || !bareVal) {
        errors.push({
          code: "EXPRESSION_BARE_KEY_MISSING",
          message: `Expression rule '${bareKey}': compiled formula missing \u2014 fd:rules["${bareKey}"] must be a non-empty string`,
          path: `fd:rules["${bareKey}"]`,
          fix: `Set fd:rules["${bareKey}"] = fdRules["${fdKey}"].content from generate-formula output (must be a string, not an array)`
        });
      } else if (Array.isArray(bareVal)) {
        errors.push({
          code: "EXPRESSION_BARE_KEY_IS_ARRAY",
          message: `Expression rule '${bareKey}': fd:rules["${bareKey}"] is an array but must be a plain formula string`,
          path: `fd:rules["${bareKey}"]`,
          fix: `Use fdRules["${fdKey}"].content as a string \u2014 if generate-formula returned an array, use content[0]`
        });
      }
    }
    if (isEvent) {
      if (bareKey in fdRules) {
        errors.push({
          code: "EVENT_COMPILED_IN_FD_RULES",
          message: `Event rule '${bareKey}': compiled script must not be in fd:rules \u2014 remove fd:rules["${bareKey}"]`,
          path: `fd:rules["${bareKey}"]`,
          fix: `Remove fd:rules["${bareKey}"] and move that value to fd:events["${bareKey}"] \u2014 route fdRules["${fdKey}"].content to fd:events`
        });
      }
      const eventsVal = fdEvents[bareKey];
      if (!(bareKey in fdEvents) || !eventsVal) {
        errors.push({
          code: "EVENT_MISSING_FROM_FD_EVENTS",
          message: `Event rule '${bareKey}': compiled script missing \u2014 fd:events["${bareKey}"] must be a non-empty array`,
          path: `fd:events["${bareKey}"]`,
          fix: `Set fd:events["${bareKey}"] = fdRules["${fdKey}"].content from generate-formula output (must be an array)`
        });
      } else if (!Array.isArray(eventsVal)) {
        errors.push({
          code: "FD_EVENTS_VALUE_NOT_ARRAY",
          message: `fd:events["${bareKey}"] must be an array of scripts, not a ${typeof eventsVal}`,
          path: `fd:events["${bareKey}"]`,
          fix: `Wrap the value in an array: fd:events["${bareKey}"] = [value]`
        });
      }
      if (bareKey === "submitFailure") {
        warnings.push({
          code: "DEPRECATED_EVENT_KEY",
          message: `'submitFailure' is deprecated \u2014 prefer 'submitError' (agent-kb/05)`,
          path: `fd:rules["${fdKey}"]`
        });
      }
    }
  }
  const bareKeysInFdRules = Object.keys(fdRules).filter((k) => !k.startsWith("fd:"));
  for (const bareKey of bareKeysInFdRules) {
    if (!(`fd:${bareKey}` in fdRules)) {
      errors.push({
        code: "ORPHANED_BARE_KEY",
        message: `fd:rules["${bareKey}"] has no corresponding "fd:${bareKey}" raw AST entry`,
        path: `fd:rules["${bareKey}"]`,
        fix: `Either add fd:rules["fd:${bareKey}"] = [JSON.stringify(ruleAst)], or remove the orphaned "${bareKey}" key`
      });
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
try {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    throw new Error("Usage: validate-merge.bundle.js <merged-rule.json>");
  }
  const merged = JSON.parse((0, import_fs.readFileSync)(args[0], "utf8"));
  const result = validateMerge(merged);
  process.stdout.write(JSON.stringify(result) + "\n");
  process.exit(result.valid ? 0 : 1);
} catch (e) {
  process.stdout.write(JSON.stringify({ valid: false, errors: [{ code: "CLI_ERROR", message: e.message }], warnings: [] }) + "\n");
  process.exit(1);
}
