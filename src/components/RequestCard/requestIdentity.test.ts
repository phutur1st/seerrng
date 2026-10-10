import assert from 'node:assert/strict';
import test from 'node:test';
import { getBookRequestId, getSportsRequestId } from './requestIdentity';

test('Bookshelf-only requests preserve their provider identity for recent cards', () => {
  assert.equal(
    getBookRequestId({
      media: {
        identifiers: [{ provider: 'bookshelf', value: 'bookshelf:0:384057' }],
      },
    }),
    'bookshelf:0:384057'
  );
  assert.equal(
    getBookRequestId({
      media: {
        identifiers: [
          { provider: 'openlibrary', value: '/works/OL123W' },
          { provider: 'bookshelf', value: 'bookshelf:0:384057' },
        ],
      },
    }),
    'OL123W'
  );
});

test('sports recent cards use their external league identifier instead of TMDB', () => {
  assert.equal(
    getSportsRequestId({
      media: {
        identifiers: [{ provider: 'sportarr', value: 'ufc' }],
        externalServiceSlug: 'fallback',
      },
    }),
    'ufc'
  );
  assert.equal(
    getSportsRequestId({ media: { externalServiceSlug: 'ufc' } }),
    'ufc'
  );
  assert.equal(getSportsRequestId({ media: {} }), undefined);
});
