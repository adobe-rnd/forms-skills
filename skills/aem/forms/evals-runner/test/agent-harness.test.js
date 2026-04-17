import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { buildSystemPrompt, buildToolDispatch, runAgent } from '../lib/agent-harness.js';
import { createStubAgentProvider } from '../lib/providers/stub.js';

async function makeSkill(tree) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
  for (const [rel, content] of Object.entries(tree)) {
    const full = path.join(dir, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, content);
  }
  return dir;
}

test('buildSystemPrompt concatenates SKILL.md and all references', async () => {
  const skill = await makeSkill({
    'SKILL.md': '# The skill',
    'references/a.md': 'ref A',
    'references/nested/b.md': 'ref B'
  });
  const prompt = await buildSystemPrompt(skill);
  assert.match(prompt, /SKILL\.md/);
  assert.match(prompt, /# The skill/);
  assert.match(prompt, /references\/a\.md/);
  assert.match(prompt, /ref A/);
  assert.match(prompt, /references\/nested\/b\.md/);
  assert.match(prompt, /ref B/);
  await rm(skill, { recursive: true, force: true });
});

test('toolDispatch writes files relative to workspace', async () => {
  const ws = await mkdtemp(path.join(os.tmpdir(), 'ws-'));
  const dispatch = buildToolDispatch({ workspace: ws, allowedTools: ['Write'], mockedTools: {} });
  const result = await dispatch({ id: 't1', name: 'Write', input: { path: 'a.txt', content: 'hi' } });
  assert.match(result, /ok/i);
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(path.join(ws, 'a.txt'), 'utf8');
  assert.equal(content, 'hi');
  await rm(ws, { recursive: true, force: true });
});

test('toolDispatch rejects path escape', async () => {
  const ws = await mkdtemp(path.join(os.tmpdir(), 'ws-'));
  const dispatch = buildToolDispatch({ workspace: ws, allowedTools: ['Write'], mockedTools: {} });
  const result = await dispatch({ id: 't1', name: 'Write', input: { path: '../escape.txt', content: 'bad' } });
  assert.match(result, /outside workspace/);
  await rm(ws, { recursive: true, force: true });
});

test('toolDispatch returns mock for mocked tool', async () => {
  const ws = await mkdtemp(path.join(os.tmpdir(), 'ws-'));
  const dispatch = buildToolDispatch({ workspace: ws, allowedTools: ['api-call'], mockedTools: { 'api-call': { hello: 'world' } } });
  const result = await dispatch({ id: 't1', name: 'api-call', input: {} });
  assert.match(result, /world/);
  await rm(ws, { recursive: true, force: true });
});

test('toolDispatch errors for disallowed tool', async () => {
  const ws = await mkdtemp(path.join(os.tmpdir(), 'ws-'));
  const dispatch = buildToolDispatch({ workspace: ws, allowedTools: ['Read'], mockedTools: {} });
  const result = await dispatch({ id: 't1', name: 'Write', input: {} });
  assert.match(result, /not allowed/);
  await rm(ws, { recursive: true, force: true });
});

test('runAgent completes against stub provider', async () => {
  const skill = await makeSkill({ 'SKILL.md': 'x' });
  const ws = await mkdtemp(path.join(os.tmpdir(), 'ws-'));
  const provider = createStubAgentProvider([
    { type: 'tool_use', id: 't1', name: 'Write', input: { path: 'out.txt', content: 'done' } },
    { type: 'end_turn', text: 'finished' }
  ]);
  const result = await runAgent({
    provider,
    skillDir: skill,
    workspace: ws,
    userMessage: 'do it',
    config: { maxTurns: 5, allowedTools: ['Write'], mockedTools: {} }
  });
  assert.equal(result.stopReason, 'end_turn');
  assert.equal(result.turns.length, 3); // assistant tool_use, tool_result, assistant end_turn
  await rm(skill, { recursive: true, force: true });
  await rm(ws, { recursive: true, force: true });
});
