import { readFile, readdir, writeFile, stat, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';

async function walkMd(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return acc;
    throw err;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkMd(full, acc);
    else if (e.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

export async function buildSystemPrompt(skillDir) {
  const skillMd = path.join(skillDir, 'SKILL.md');
  const refs = await walkMd(path.join(skillDir, 'references'));
  const files = [skillMd, ...refs.sort()];
  const parts = [];
  for (const f of files) {
    try {
      const content = await readFile(f, 'utf8');
      parts.push(`=== ${path.relative(skillDir, f)} ===\n${content}`);
    } catch {}
  }
  return parts.join('\n\n');
}

function resolveInside(workspace, relPath) {
  const full = path.resolve(workspace, relPath);
  const ws = path.resolve(workspace);
  if (!full.startsWith(ws + path.sep) && full !== ws) {
    return { error: `path "${relPath}" resolves outside workspace` };
  }
  return { full };
}

export function buildToolDispatch({ workspace, allowedTools, mockedTools }) {
  return async function dispatch({ id, name, input }) {
    if (!allowedTools.includes(name)) {
      return `error: tool "${name}" not allowed`;
    }
    if (mockedTools && name in mockedTools) {
      return typeof mockedTools[name] === 'string' ? mockedTools[name] : JSON.stringify(mockedTools[name]);
    }
    try {
      switch (name) {
        case 'bash': {
          const out = execSync(input.command, { cwd: workspace, stdio: 'pipe', timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
          return `ok:\n${out.toString()}`;
        }
        case 'Read': {
          const { full, error } = resolveInside(workspace, input.path);
          if (error) return `error: ${error}`;
          return (await readFile(full, 'utf8')).slice(0, 64_000);
        }
        case 'Write': {
          const { full, error } = resolveInside(workspace, input.path);
          if (error) return `error: ${error}`;
          await mkdir(path.dirname(full), { recursive: true });
          await writeFile(full, input.content);
          return 'ok: wrote';
        }
        case 'Edit': {
          const { full, error } = resolveInside(workspace, input.path);
          if (error) return `error: ${error}`;
          const original = await readFile(full, 'utf8');
          if (!original.includes(input.old_string)) return 'error: old_string not found';
          const replaced = original.replace(input.old_string, input.new_string);
          await writeFile(full, replaced);
          return 'ok: edited';
        }
        case 'Glob': {
          const out = execSync(`find . -path './node_modules' -prune -o -name '${input.pattern.replaceAll("'", "\\'")}' -print`, { cwd: workspace, stdio: 'pipe' });
          return out.toString().slice(0, 32_000);
        }
        case 'Grep': {
          const pattern = String(input.pattern).replace(/'/g, "'\\''");
          const out = execSync(`grep -rIn --exclude-dir=node_modules '${pattern}' .`, { cwd: workspace, stdio: 'pipe' });
          return out.toString().slice(0, 32_000);
        }
        default:
          return `error: tool "${name}" has no implementation and no mock configured`;
      }
    } catch (err) {
      return `error: ${err.message}`;
    }
  };
}

const DEFAULT_TOOL_DECLARATIONS = {
  bash: {
    name: 'bash', description: 'Execute a shell command.',
    input_schema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] }
  },
  Read: {
    name: 'Read', description: 'Read a file from the workspace.',
    input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }
  },
  Write: {
    name: 'Write', description: 'Write content to a file in the workspace.',
    input_schema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] }
  },
  Edit: {
    name: 'Edit', description: 'Replace a string in a file.',
    input_schema: { type: 'object', properties: { path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' } }, required: ['path', 'old_string', 'new_string'] }
  },
  Glob: {
    name: 'Glob', description: 'Find files by name pattern.',
    input_schema: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] }
  },
  Grep: {
    name: 'Grep', description: 'Search file contents.',
    input_schema: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] }
  }
};

export async function runAgent({ provider, skillDir, workspace, userMessage, config }) {
  const systemPrompt = await buildSystemPrompt(skillDir);
  const { allowedTools, mockedTools = {}, maxTurns } = config;
  const tools = allowedTools.map(name => {
    if (DEFAULT_TOOL_DECLARATIONS[name]) return DEFAULT_TOOL_DECLARATIONS[name];
    return {
      name,
      description: `Custom tool "${name}"`,
      input_schema: { type: 'object' }
    };
  });
  const toolDispatch = buildToolDispatch({ workspace, allowedTools, mockedTools });
  return provider.runAgentLoop({ systemPrompt, userMessage, tools, maxTurns, toolDispatch });
}
