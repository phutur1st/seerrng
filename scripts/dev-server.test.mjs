import assert from 'node:assert/strict';
import test from 'node:test';
import { isServerRestartPath } from './dev-server.mjs';

test('the dev watcher restarts for server TypeScript, JSON, and YAML', () => {
  assert.equal(isServerRestartPath('server/index.ts'), true);
  assert.equal(isServerRestartPath('server/config/provider.json'), true);
  assert.equal(isServerRestartPath('server/config/provider.yml'), true);
  assert.equal(isServerRestartPath('seerr-api.yml'), true);
});

test('the dev watcher ignores files outside its configured extension set', () => {
  assert.equal(isServerRestartPath('server/templates/page.pug'), false);
  assert.equal(isServerRestartPath('server/readme.md'), false);
  assert.equal(isServerRestartPath('src/index.ts'), false);
  assert.equal(isServerRestartPath('seerr-api.json'), false);
});
