import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScenarios } from '../lib/load-scenarios.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleDir = path.join(__dirname, 'fixtures', 'scenarios-sample');

test('loads and validates scenarios from a directory', async () => {
  const results = await loadScenarios(sampleDir);
  const valid = results.find(r => r.file.endsWith('valid.json'));
  const missing = results.find(r => r.file.endsWith('invalid-missing-id.json'));
  const syntax = results.find(r => r.file.endsWith('invalid-syntax.json'));

  assert.equal(valid.ok, true);
  assert.equal(valid.scenario.id, 'valid-scenario');

  assert.equal(missing.ok, false);
  assert.match(missing.errors.join(','), /missing required property "id"/);

  assert.equal(syntax.ok, false);
  assert.match(syntax.errors.join(','), /JSON/i);
});

test('filters by id substring when provided', async () => {
  const results = await loadScenarios(sampleDir, { filter: 'valid' });
  assert.equal(results.length, 1);
  assert.ok(results[0].file.endsWith('valid.json'));
});

test('returns empty array for missing directory', async () => {
  const results = await loadScenarios(path.join(sampleDir, 'nonexistent'));
  assert.deepEqual(results, []);
});
