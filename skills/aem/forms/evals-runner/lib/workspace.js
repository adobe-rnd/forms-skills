import { mkdtemp, rm, cp, stat } from 'node:fs/promises';
import { rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const activeWorkspaces = new Set();

for (const signal of ['exit', 'SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const ws of activeWorkspaces) {
      try {
        rmSync(ws, { recursive: true, force: true });
      } catch {}
    }
    if (signal !== 'exit') process.exit(1);
  });
}

export async function findPluginRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    try {
      await stat(path.join(dir, '.claude-plugin', 'plugin.json'));
      return dir;
    } catch {}
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export async function resolveFixture({ skillDir, fixtureName }) {
  const local = path.join(skillDir, 'evals', 'fixtures', fixtureName);
  try { await stat(local); return local; } catch {}

  const pluginRoot = await findPluginRoot(skillDir);
  if (!pluginRoot) {
    throw new Error(`fixture "${fixtureName}" not found: plugin root not discoverable from ${skillDir}`);
  }
  const shared = path.join(pluginRoot, 'evals-fixtures', fixtureName);
  try { await stat(shared); return shared; } catch {}

  throw new Error(`fixture "${fixtureName}" not found. Checked:\n  ${local}\n  ${shared}`);
}

export async function seedWorkspace({ fixturePath, scenarioId, attempt }) {
  const rand = crypto.randomBytes(4).toString('hex');
  const ws = await mkdtemp(path.join(os.tmpdir(), `skill-evals-${scenarioId}-${attempt}-${rand}-`));
  await cp(fixturePath, ws, { recursive: true, preserveTimestamps: true });
  activeWorkspaces.add(ws);
  return ws;
}

export async function teardownWorkspace(ws) {
  activeWorkspaces.delete(ws);
  await rm(ws, { recursive: true, force: true });
}
