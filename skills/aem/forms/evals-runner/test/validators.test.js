import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { runValidators } from '../lib/validators.js';

async function makeTempWorkspace() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'evals-test-'));
  return dir;
}

test('file_exists passes when file exists', async () => {
  const ws = await makeTempWorkspace();
  await mkdir(path.join(ws, 'sub'), { recursive: true });
  await writeFile(path.join(ws, 'sub/a.txt'), 'hello');
  const res = await runValidators(ws, [{ type: 'file_exists', path: 'sub/a.txt' }]);
  assert.equal(res[0].passed, true);
  await rm(ws, { recursive: true, force: true });
});

test('file_exists fails when file missing', async () => {
  const ws = await makeTempWorkspace();
  const res = await runValidators(ws, [{ type: 'file_exists', path: 'missing.txt' }]);
  assert.equal(res[0].passed, false);
  assert.match(res[0].reason, /not found/);
  await rm(ws, { recursive: true, force: true });
});

test('file_contains matches regex', async () => {
  const ws = await makeTempWorkspace();
  await writeFile(path.join(ws, 'x.js'), 'const listenChanges = true;');
  const res = await runValidators(ws, [{ type: 'file_contains', path: 'x.js', pattern: 'listenChanges\\s*=\\s*true' }]);
  assert.equal(res[0].passed, true);
  await rm(ws, { recursive: true, force: true });
});

test('file_not_contains fails when pattern found', async () => {
  const ws = await makeTempWorkspace();
  await writeFile(path.join(ws, 'x.js'), 'TODO: implement');
  const res = await runValidators(ws, [{ type: 'file_not_contains', path: 'x.js', pattern: 'TODO' }]);
  assert.equal(res[0].passed, false);
  await rm(ws, { recursive: true, force: true });
});

test('json_path_equals finds value via recursive walk', async () => {
  const ws = await makeTempWorkspace();
  await writeFile(path.join(ws, 'f.json'), JSON.stringify({ nested: { 'fd:viewType': 'countdown-timer' } }));
  const res = await runValidators(ws, [{
    type: 'json_path_equals', path: 'f.json', property: 'fd:viewType', expected: 'countdown-timer'
  }]);
  assert.equal(res[0].passed, true);
  await rm(ws, { recursive: true, force: true });
});

test('command_passes exits 0', async () => {
  const ws = await makeTempWorkspace();
  const res = await runValidators(ws, [{ type: 'command_passes', command: 'true' }]);
  assert.equal(res[0].passed, true);
  await rm(ws, { recursive: true, force: true });
});

test('command_passes records nonzero exit', async () => {
  const ws = await makeTempWorkspace();
  const res = await runValidators(ws, [{ type: 'command_passes', command: 'false' }]);
  assert.equal(res[0].passed, false);
  await rm(ws, { recursive: true, force: true });
});

test('path escape attempt rejected', async () => {
  const ws = await makeTempWorkspace();
  const res = await runValidators(ws, [{ type: 'file_exists', path: '../escaped.txt' }]);
  assert.equal(res[0].passed, false);
  assert.match(res[0].reason, /outside workspace/);
  await rm(ws, { recursive: true, force: true });
});

test('required defaults to true; unknown validator type errors', async () => {
  const ws = await makeTempWorkspace();
  const res = await runValidators(ws, [{ type: 'nope' }]);
  assert.equal(res[0].passed, false);
  assert.equal(res[0].required, true);
  assert.match(res[0].reason, /unknown validator/);
  await rm(ws, { recursive: true, force: true });
});
