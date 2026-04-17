import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './schema-validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'scenario.schema.json');

let cachedSchema = null;
async function getSchema() {
  if (!cachedSchema) {
    cachedSchema = JSON.parse(await readFile(SCHEMA_PATH, 'utf8'));
  }
  return cachedSchema;
}

export async function loadScenarios(scenariosDir, { filter } = {}) {
  let entries;
  try {
    entries = await readdir(scenariosDir);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  const schema = await getSchema();
  const files = entries.filter(f => f.endsWith('.json')).sort();
  const results = [];

  for (const file of files) {
    const full = path.join(scenariosDir, file);
    const result = { file: full, ok: false, scenario: null, errors: [] };
    let raw;
    try {
      raw = await readFile(full, 'utf8');
    } catch (err) {
      result.errors.push(`Cannot read: ${err.message}`);
      results.push(result);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      result.errors.push(`Invalid JSON: ${err.message}`);
      results.push(result);
      continue;
    }
    const { valid, errors } = validate(schema, parsed);
    if (!valid) {
      result.errors = errors;
      results.push(result);
      continue;
    }
    result.ok = true;
    result.scenario = parsed;
    results.push(result);
  }

  if (filter) {
    return results.filter(r => (r.scenario?.id ?? '').includes(filter));
  }
  return results;
}
