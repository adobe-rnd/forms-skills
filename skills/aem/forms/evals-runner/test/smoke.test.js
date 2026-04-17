import { test } from 'node:test';
import assert from 'node:assert/strict';

test('runner package loads', async () => {
  const pkg = await import('../package.json', { with: { type: 'json' } });
  assert.equal(pkg.default.name, '@adobe/forms-evals-runner');
});
