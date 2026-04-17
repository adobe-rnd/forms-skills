import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runJudge, parseJudgeResponse } from '../lib/judge.js';
import { createStubJudgeProvider } from '../lib/providers/stub.js';

const transcript = { turns: [{ role: 'assistant', text: 'I did the thing.', toolCalls: [] }] };
const criteria = [{ id: 'c1', description: 'Did the thing?', required: true }];

test('parses clean JSON response', () => {
  const parsed = parseJudgeResponse('[{"id":"c1","passed":true,"reason":"did it"}]', criteria);
  assert.equal(parsed.results[0].id, 'c1');
  assert.equal(parsed.results[0].passed, true);
});

test('tolerates surrounding prose', () => {
  const parsed = parseJudgeResponse('Here is the result:\n[{"id":"c1","passed":true,"reason":"ok"}]\nDone.', criteria);
  assert.equal(parsed.results[0].passed, true);
});

test('tolerates markdown code fences', () => {
  const parsed = parseJudgeResponse('```json\n[{"id":"c1","passed":false,"reason":"nope"}]\n```', criteria);
  assert.equal(parsed.results[0].passed, false);
});

test('fills missing criteria with failure', () => {
  const parsed = parseJudgeResponse('[]', criteria);
  assert.equal(parsed.results.length, 1);
  assert.equal(parsed.results[0].passed, false);
  assert.match(parsed.results[0].reason, /no judgment/);
});

test('returns null results when parse fails', () => {
  const parsed = parseJudgeResponse('this is not JSON at all', criteria);
  assert.equal(parsed.results, null);
  assert.match(parsed.parseError, /parse/i);
});

test('runJudge retries once on parse failure', async () => {
  const provider = createStubJudgeProvider([
    { raw: 'garbage' },
    { raw: '[{"id":"c1","passed":true,"reason":"ok"}]' }
  ]);
  const out = await runJudge({ provider, userMessage: 'x', transcript, criteria });
  assert.equal(out.results[0].passed, true);
  assert.equal(out.reprompted, true);
});

test('runJudge reports failure after second bad response', async () => {
  const provider = createStubJudgeProvider([
    { raw: 'first garbage' },
    { raw: 'second garbage' }
  ]);
  const out = await runJudge({ provider, userMessage: 'x', transcript, criteria });
  assert.equal(out.results, null);
  assert.match(out.parseError, /parse/i);
});
