import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { diffBaseline, approve } from '../lib/baseline.js';

async function setup() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'baseline-test-'));
  await mkdir(path.join(dir, 'baseline'));
  await mkdir(path.join(dir, 'results'));
  return dir;
}

test('no regression when current matches baseline', async () => {
  const dir = await setup();
  const card = { scenarioId: 's1', verdict: 'pass', validators: [], rubric: [], requiredFailures: [] };
  await writeFile(path.join(dir, 'baseline', 's1.json'), JSON.stringify(card));
  await mkdir(path.join(dir, 'results', 's1'));
  await writeFile(path.join(dir, 'results', 's1', 'score.json'), JSON.stringify(card));

  const diff = await diffBaseline({ baselineDir: path.join(dir, 'baseline'), resultsDir: path.join(dir, 'results') });
  assert.deepEqual(diff.regressions, []);
  assert.deepEqual(diff.newScenarios, []);
  await rm(dir, { recursive: true, force: true });
});

test('regression when pass flips to fail', async () => {
  const dir = await setup();
  const baseCard = { scenarioId: 's1', verdict: 'pass', validators: [], rubric: [], requiredFailures: [] };
  const curCard = { scenarioId: 's1', verdict: 'fail', validators: [], rubric: [], requiredFailures: ['validator:file_exists(x) — missing'] };
  await writeFile(path.join(dir, 'baseline', 's1.json'), JSON.stringify(baseCard));
  await mkdir(path.join(dir, 'results', 's1'));
  await writeFile(path.join(dir, 'results', 's1', 'score.json'), JSON.stringify(curCard));

  const diff = await diffBaseline({ baselineDir: path.join(dir, 'baseline'), resultsDir: path.join(dir, 'results') });
  assert.equal(diff.regressions.length, 1);
  assert.equal(diff.regressions[0].scenarioId, 's1');
  assert.match(diff.regressions[0].reason, /pass.*fail/i);
  await rm(dir, { recursive: true, force: true });
});

test('regression when baseline scenario missing from current', async () => {
  const dir = await setup();
  const baseCard = { scenarioId: 's1', verdict: 'pass', validators: [], rubric: [], requiredFailures: [] };
  await writeFile(path.join(dir, 'baseline', 's1.json'), JSON.stringify(baseCard));

  const diff = await diffBaseline({ baselineDir: path.join(dir, 'baseline'), resultsDir: path.join(dir, 'results') });
  assert.equal(diff.regressions.length, 1);
  assert.match(diff.regressions[0].reason, /missing/i);
  await rm(dir, { recursive: true, force: true });
});

test('new scenarios listed but not regressions', async () => {
  const dir = await setup();
  const curCard = { scenarioId: 's1', verdict: 'pass', validators: [], rubric: [], requiredFailures: [] };
  await mkdir(path.join(dir, 'results', 's1'));
  await writeFile(path.join(dir, 'results', 's1', 'score.json'), JSON.stringify(curCard));

  const diff = await diffBaseline({ baselineDir: path.join(dir, 'baseline'), resultsDir: path.join(dir, 'results') });
  assert.deepEqual(diff.regressions, []);
  assert.deepEqual(diff.newScenarios, ['s1']);
  await rm(dir, { recursive: true, force: true });
});

test('approve copies current score.json files to baseline', async () => {
  const dir = await setup();
  const curCard = { scenarioId: 's1', verdict: 'pass', validators: [], rubric: [], requiredFailures: [] };
  await mkdir(path.join(dir, 'results', 's1'));
  await writeFile(path.join(dir, 'results', 's1', 'score.json'), JSON.stringify(curCard));

  await approve({ baselineDir: path.join(dir, 'baseline'), resultsDir: path.join(dir, 'results') });
  const written = JSON.parse(await readFile(path.join(dir, 'baseline', 's1.json'), 'utf8'));
  assert.equal(written.scenarioId, 's1');
  await rm(dir, { recursive: true, force: true });
});
