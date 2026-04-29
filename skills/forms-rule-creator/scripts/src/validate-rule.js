#!/usr/bin/env node
// Validates a rule AST JSON against a treeJson scope.
// Wraps @aemforms/rule-editor-transformer validate-rule CLI.
//
// Usage:
//   node validate-rule.bundle.js <rule.json> --tree <treeJson.json> [--functions <cf.json>] [--storage-path <fd:click>]
//
// Output:
//   { valid: true, errors: [], warnings: [] }
//   { valid: false, errors: [...], warnings: [...] }
//
// Exit codes:
//   0  valid
//   1  invalid or error

import { readFileSync } from 'fs';
import { RuleTransformer, RBScope } from '@aemforms/rule-editor-transformer';

function parseArgs(args) {
  const result = { rulePath: null, treePath: null, functionsPath: null, storagePath: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tree') result.treePath = args[++i];
    else if (args[i] === '--functions') result.functionsPath = args[++i];
    else if (args[i] === '--storage-path') result.storagePath = args[++i];
    else if (!args[i].startsWith('--')) result.rulePath = args[i];
  }
  return result;
}

try {
  const { rulePath, treePath, functionsPath, storagePath } = parseArgs(process.argv.slice(2));

  if (!rulePath || !treePath) {
    throw new Error('Usage: validate-rule.bundle.js <rule.json> --tree <treeJson.json> [--functions <cf.json>] [--storage-path <fd:click>]');
  }

  const ruleJson = JSON.parse(readFileSync(rulePath, 'utf8'));
  const treeJson = JSON.parse(readFileSync(treePath, 'utf8'));
  const customFunctions = functionsPath
    ? JSON.parse(readFileSync(functionsPath, 'utf8'))
    : [];

  const scope = new RBScope(treeJson, customFunctions);
  const transformer = new RuleTransformer({ scope });
  const result = transformer.validate(ruleJson, { storagePath });

  process.stdout.write(JSON.stringify(result) + '\n');
  process.exit(result.valid ? 0 : 1);
} catch (e) {
  process.stdout.write(JSON.stringify({ valid: false, errors: [{ code: 'CLI_ERROR', message: e.message }], warnings: [] }) + '\n');
  process.exit(1);
}
