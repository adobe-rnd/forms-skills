#!/usr/bin/env node
// Compiles a rule AST JSON to JSON Formula using RuleTransformer.transform().
// Equivalent to the planned aemf-generate-formula CLI (not yet in the package).
//
// Usage:
//   node generate-formula.bundle.js <rule.json> --tree <treeJson.json> [--functions <cf.json>] [--event <fd:key>]
//
// Output:
//   { success: true, formulaValid: true, fdRules: {...}, fdEvents: {...} }
//   { success: false, error: "..." }
//
// Exit codes:
//   0  Success + formulaValid: true
//   1  Failure or formulaValid: false

import { readFileSync } from 'fs';
import { RuleTransformer, RBScope } from '@aemforms/rule-editor-transformer';

function parseArgs(args) {
  const result = { rulePath: null, treePath: null, functionsPath: null, storagePath: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tree') result.treePath = args[++i];
    else if (args[i] === '--functions') result.functionsPath = args[++i];
    else if (args[i] === '--event') result.storagePath = args[++i];
    else if (!args[i].startsWith('--')) result.rulePath = args[i];
  }
  return result;
}

try {
  const { rulePath, treePath, functionsPath, storagePath } = parseArgs(process.argv.slice(2));

  if (!rulePath || !treePath) {
    throw new Error('Usage: generate-formula.bundle.js <rule.json> --tree <treeJson.json> [--functions <cf.json>] [--event <fd:key>]');
  }

  const ruleJson = JSON.parse(readFileSync(rulePath, 'utf8'));
  const treeJson = JSON.parse(readFileSync(treePath, 'utf8'));
  const customFunctions = functionsPath
    ? JSON.parse(readFileSync(functionsPath, 'utf8'))
    : [];

  const scope = new RBScope(treeJson, customFunctions);
  const transformer = new RuleTransformer({ scope });

  // transform() handles both single AST (with nodeName) and fd:* field input
  const transformed = transformer.transform(ruleJson, {
    preflight: true,
    storagePath,
  });

  // Normalise output to match aemf-generate-formula contract:
  // { success, formulaValid, fdRules, fdEvents }
  // The FieldTransformer returns { fdRules, fdEvents } when input has fd:* keys.
  // The JsonFormulaTransformer returns an expression string when input has nodeName.
  const isField = !ruleJson.nodeName;
  const output = isField
    ? {
        success: true,
        formulaValid: true,
        fdRules: transformed.fdRules || {},
        fdEvents: transformed.fdEvents || {},
      }
    : {
        success: true,
        formulaValid: true,
        fdRules: { [storagePath || 'expression']: transformed },
        fdEvents: {},
      };

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  process.exit(0);
} catch (e) {
  process.stdout.write(JSON.stringify({ success: false, formulaValid: false, error: e.message }) + '\n');
  process.exit(1);
}
