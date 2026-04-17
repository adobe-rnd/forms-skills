import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

async function readJsonIfExists(p) {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

async function readBaselines(baselineDir) {
  const out = new Map();
  let entries;
  try {
    entries = await readdir(baselineDir);
  } catch (err) {
    if (err.code === 'ENOENT') return out;
    throw err;
  }
  for (const file of entries.filter(f => f.endsWith('.json'))) {
    const card = await readJsonIfExists(path.join(baselineDir, file));
    if (card?.scenarioId) out.set(card.scenarioId, card);
  }
  return out;
}

async function readCurrent(resultsDir) {
  const out = new Map();
  let entries;
  try {
    entries = await readdir(resultsDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return out;
    throw err;
  }
  for (const d of entries.filter(d => d.isDirectory())) {
    const p = path.join(resultsDir, d.name, 'score.json');
    const card = await readJsonIfExists(p);
    if (card?.scenarioId) out.set(card.scenarioId, card);
  }
  return out;
}

export async function diffBaseline({ baselineDir, resultsDir }) {
  const baseline = await readBaselines(baselineDir);
  const current = await readCurrent(resultsDir);

  const regressions = [];
  const newScenarios = [];
  const matches = [];

  for (const [id, baseCard] of baseline) {
    const curCard = current.get(id);
    if (!curCard) {
      regressions.push({ scenarioId: id, reason: 'Scenario missing from current results (was present in baseline).' });
      continue;
    }
    if (baseCard.verdict === 'pass' && curCard.verdict === 'fail') {
      regressions.push({
        scenarioId: id,
        reason: `Verdict regressed: pass → fail. Failures:\n  - ${curCard.requiredFailures.join('\n  - ')}`
      });
      continue;
    }
    matches.push(id);
  }

  for (const [id] of current) {
    if (!baseline.has(id)) newScenarios.push(id);
  }

  return { regressions, newScenarios, matches };
}

export async function approve({ baselineDir, resultsDir }) {
  await mkdir(baselineDir, { recursive: true });
  const current = await readCurrent(resultsDir);
  for (const [id, card] of current) {
    await writeFile(path.join(baselineDir, `${id}.json`), JSON.stringify(card, null, 2));
  }
  return current.size;
}
