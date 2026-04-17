import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../lib/schema-validate.js';

const schema = {
  type: 'object',
  required: ['id', 'description'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 1 },
    description: { type: 'string' },
    count: { type: 'integer', minimum: 0 }
  }
};

test('valid object passes', () => {
  const r = validate(schema, { id: 'x', description: 'y', count: 1 });
  assert.deepEqual(r.errors, []);
});

test('missing required field fails', () => {
  const r = validate(schema, { id: 'x' });
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /description/);
});

test('wrong type fails', () => {
  const r = validate(schema, { id: 123, description: 'y' });
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /id.*string/);
});

test('unknown property fails when additionalProperties false', () => {
  const r = validate(schema, { id: 'x', description: 'y', extra: 1 });
  assert.match(r.errors[0], /extra/);
});

test('integer minimum enforced', () => {
  const r = validate(schema, { id: 'x', description: 'y', count: -1 });
  assert.match(r.errors[0], /minimum/);
});

test('nested array of strings validates element types', () => {
  const arrSchema = { type: 'array', items: { type: 'string' } };
  const r = validate(arrSchema, ['a', 1, 'b']);
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /\[1\].*string/);
});
