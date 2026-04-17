import { readFile, stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';

function resolveInside(workspace, relPath) {
  const full = path.resolve(workspace, relPath);
  const wsResolved = path.resolve(workspace);
  if (!full.startsWith(wsResolved + path.sep) && full !== wsResolved) {
    return { error: `path "${relPath}" resolves outside workspace` };
  }
  return { full };
}

const TYPES = {
  async file_exists(workspace, cfg) {
    const { full, error } = resolveInside(workspace, cfg.path);
    if (error) return { passed: false, reason: error };
    try {
      await stat(full);
      return { passed: true, reason: `exists: ${cfg.path}` };
    } catch {
      return { passed: false, reason: `file not found: ${cfg.path}` };
    }
  },
  async file_contains(workspace, cfg) {
    const { full, error } = resolveInside(workspace, cfg.path);
    if (error) return { passed: false, reason: error };
    try {
      const content = await readFile(full, 'utf8');
      const re = new RegExp(cfg.pattern);
      return re.test(content)
        ? { passed: true, reason: `matched /${cfg.pattern}/ in ${cfg.path}` }
        : { passed: false, reason: `pattern /${cfg.pattern}/ not found in ${cfg.path}` };
    } catch (err) {
      return { passed: false, reason: `cannot read ${cfg.path}: ${err.message}` };
    }
  },
  async file_not_contains(workspace, cfg) {
    const r = await TYPES.file_contains(workspace, cfg);
    if (r.reason.startsWith('cannot read')) return r;
    return r.passed
      ? { passed: false, reason: `pattern /${cfg.pattern}/ found in ${cfg.path} (should be absent)` }
      : { passed: true, reason: `pattern /${cfg.pattern}/ absent in ${cfg.path}` };
  },
  async json_path_equals(workspace, cfg) {
    const { full, error } = resolveInside(workspace, cfg.path);
    if (error) return { passed: false, reason: error };
    let data;
    try {
      data = JSON.parse(await readFile(full, 'utf8'));
    } catch (err) {
      return { passed: false, reason: `cannot parse JSON ${cfg.path}: ${err.message}` };
    }
    const prop = cfg.property;
    const found = [];
    (function walk(node) {
      if (node === null || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      for (const [k, v] of Object.entries(node)) {
        if (k === prop) found.push(v);
        walk(v);
      }
    })(data);
    if (found.length === 0) return { passed: false, reason: `property "${prop}" not found in ${cfg.path}` };
    if (found.some(v => v === cfg.expected)) {
      return { passed: true, reason: `property "${prop}" = ${JSON.stringify(cfg.expected)} in ${cfg.path}` };
    }
    return { passed: false, reason: `property "${prop}" found but no occurrence equals ${JSON.stringify(cfg.expected)} (saw ${JSON.stringify(found)})` };
  },
  async command_passes(workspace, cfg) {
    const cwd = cfg.cwd ? path.resolve(workspace, cfg.cwd) : workspace;
    try {
      execSync(cfg.command, { cwd, stdio: 'pipe', timeout: 60_000 });
      return { passed: true, reason: `command exited 0: ${cfg.command}` };
    } catch (err) {
      return { passed: false, reason: `command failed (${err.status}): ${cfg.command}` };
    }
  }
};

export async function runValidators(workspace, validators) {
  const results = [];
  for (const v of validators) {
    const required = v.required !== false;
    const impl = TYPES[v.type];
    if (!impl) {
      results.push({ type: v.type, name: v.name, required, passed: false, reason: `unknown validator type "${v.type}"`, config: v });
      continue;
    }
    const out = await impl(workspace, v);
    results.push({ type: v.type, name: v.name, required, passed: out.passed, reason: out.reason, config: v });
  }
  return results;
}
