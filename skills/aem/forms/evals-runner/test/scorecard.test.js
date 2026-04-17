import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildScorecard } from '../lib/scorecard.js';

test('verdict is pass when all required pass', () => {
  const card = buildScorecard({
    scenarioId: 's1',
    attempts: 1,
    duration_ms: 1000,
    validators: [{ type: 'file_exists', required: true, passed: true, reason: 'ok' }],
    rubric: [{ id: 'r1', required: true, passed: true, reason: 'ok' }]
  });
  assert.equal(card.verdict, 'pass');
  assert.deepEqual(card.requiredFailures, []);
});

test('verdict is fail when a required validator fails', () => {
  const card = buildScorecard({
    scenarioId: 's1',
    attempts: 2,
    duration_ms: 1000,
    validators: [{ type: 'file_exists', required: true, passed: false, reason: 'missing', config: { path: 'x' } }],
    rubric: [{ id: 'r1', required: true, passed: true, reason: 'ok' }]
  });
  assert.equal(card.verdict, 'fail');
  assert.equal(card.requiredFailures.length, 1);
  assert.match(card.requiredFailures[0], /file_exists/);
});

test('verdict is fail when a required rubric fails', () => {
  const card = buildScorecard({
    scenarioId: 's1',
    attempts: 1,
    duration_ms: 1000,
    validators: [],
    rubric: [{ id: 'r1', required: true, passed: false, reason: 'nope' }]
  });
  assert.equal(card.verdict, 'fail');
  assert.match(card.requiredFailures[0], /r1/);
});

test('non-required failures do not flip verdict', () => {
  const card = buildScorecard({
    scenarioId: 's1',
    attempts: 1,
    duration_ms: 1000,
    validators: [{ type: 'file_exists', required: false, passed: false, reason: 'missing', config: { path: 'x' } }],
    rubric: [{ id: 'r1', required: false, passed: false, reason: 'nope' }]
  });
  assert.equal(card.verdict, 'pass');
  assert.deepEqual(card.requiredFailures, []);
});
