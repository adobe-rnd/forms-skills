import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPluginRoot, resolveFixture, seedWorkspace, teardownWorkspace } from '../lib/workspace.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.join(__dirname, 'fixtures', 'plugin-root');
const skillA = path.join(pluginRoot, 'skill-a');
const skillB = path.join(pluginRoot, 'skill-b');

test('findPluginRoot walks up to .claude-plugin/plugin.json', async () => {
  const found = await findPluginRoot(path.join(skillA, 'evals'));
  assert.equal(found, pluginRoot);
});

test('findPluginRoot returns null when no plugin.json above', async () => {
  const found = await findPluginRoot('/tmp');
  assert.equal(found, null);
});

test('resolveFixture prefers per-skill override', async () => {
  const resolved = await resolveFixture({ skillDir: skillA, fixtureName: 'local-only' });
  assert.equal(resolved, path.join(skillA, 'evals/fixtures/local-only'));
});

test('resolveFixture falls back to shared pool', async () => {
  const resolved = await resolveFixture({ skillDir: skillB, fixtureName: 'shared-fix' });
  assert.equal(resolved, path.join(pluginRoot, 'evals-fixtures/shared-fix'));
});

test('resolveFixture throws when fixture not found anywhere', async () => {
  await assert.rejects(
    () => resolveFixture({ skillDir: skillB, fixtureName: 'missing' }),
    /fixture "missing" not found/
  );
});

test('seedWorkspace copies fixture into temp dir', async () => {
  const fixture = path.join(pluginRoot, 'evals-fixtures/shared-fix');
  const ws = await seedWorkspace({ fixturePath: fixture, scenarioId: 's1', attempt: 1 });
  const s = await stat(ws);
  assert.ok(s.isDirectory());
  const content = await readFile(path.join(ws, 'hello.txt'), 'utf8');
  assert.equal(content.trim(), 'shared');
  await teardownWorkspace(ws);
  await assert.rejects(() => stat(ws));
});
