import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCommitMessage } from './commit-message-prompt.mjs';

test('the local commit prompt formats conventional headers and optional footers', () => {
  assert.equal(
    formatCommitMessage({
      type: 'fix',
      scope: 'requests',
      subject: 'restore edit action',
      body: 'Keep the selected request identity when opening the editor.',
      breakingChange: 'The old request payload field is removed.',
      issues: '#159',
    }),
    'fix(requests): restore edit action\n\n' +
      'Keep the selected request identity when opening the editor.\n\n' +
      'BREAKING CHANGE: The old request payload field is removed.\n\n' +
      'Closes #159\n'
  );
});

test('the local commit prompt rejects invalid types and multiline subjects', () => {
  assert.throws(
    () => formatCommitMessage({ type: 'unknown', subject: 'change' }),
    /Unsupported Conventional Commit type/
  );
  assert.throws(
    () => formatCommitMessage({ type: 'fix', subject: 'first\nsecond' }),
    /single line/
  );
});
