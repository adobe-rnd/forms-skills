#!/usr/bin/env node
// Converts an AEM Sites Content API content model (from get-aem-page-content)
// into a treeJson compatible with aemf-validate-rule and generate-formula.bundle.js.
//
// Replaces the aemf-transform-jcr step — no infinity.json or extra HTTP call needed.
// The content model is already in memory from the prior forms-content-update workflow.
//
// Usage:
//   node content-model-to-tree.bundle.js --content-model '<json>'
//   node content-model-to-tree.bundle.js --content-model-file /tmp/content-model.json
//   node content-model-to-tree.bundle.js --content-model '<json>' --output /tmp/my-tree.json
//
// Output:
//   Writes treeJson to --output path (default: /tmp/treeJson-<pid>.json)
//   Prints { success: true, treeJson: {...}, outputPath: '/tmp/...' } to stdout
//
// Exit codes:
//   0  Success
//   1  Error — message written to stderr

import { readFileSync, writeFileSync } from 'fs';
import { ScopeBuilder } from '@aemforms/rule-editor-transformer';

const args = process.argv.slice(2);

function arg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
}

const contentModelJson = arg('--content-model');
const contentModelFile = arg('--content-model-file');
const outputPath = arg('--output') || `/tmp/treeJson-${process.pid}.json`;

if (!contentModelJson && !contentModelFile) {
  process.stderr.write(
    'Usage: node content-model-to-tree.bundle.js --content-model \'<json>\'\n'
    + '       node content-model-to-tree.bundle.js --content-model-file <path>\n'
    + '       Optional: --output <path>  (default: /tmp/treeJson-<pid>.json)\n',
  );
  process.exit(1);
}

let contentModel;
try {
  const isFilePath = s => typeof s === 'string' && (s.startsWith('/') || s.startsWith('./') || s.startsWith('~/'));
  const raw = (contentModelJson && !isFilePath(contentModelJson))
    ? contentModelJson
    : readFileSync(contentModelFile || contentModelJson, 'utf8');
  const parsed = JSON.parse(raw);
  // Unwrap { eTag, data } API response format from get-aem-page-content
  contentModel = (parsed.data && typeof parsed.data === 'object') ? parsed.data : parsed;
} catch (err) {
  process.stderr.write(`Error: could not parse content model: ${err.message}\n`);
  process.exit(1);
}

let treeJson;
try {
  treeJson = ScopeBuilder.fromContentModel(contentModel);
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
}

try {
  writeFileSync(outputPath, JSON.stringify(treeJson, null, 2));
} catch (err) {
  process.stderr.write(`Error: could not write ${outputPath}: ${err.message}\n`);
  process.exit(1);
}

process.stdout.write(JSON.stringify({ success: true, treeJson, outputPath }, null, 2) + '\n');
process.exit(0);
