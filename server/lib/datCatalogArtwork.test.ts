import type { SoftwareCatalogGame } from '@server/api/software/types';
import assert from 'node:assert/strict';
import { beforeEach, it } from 'node:test';
import cacheManager from './cache';
import { enrichDatCatalogArtwork } from './datCatalogArtwork';

const key = `dat-${'1'.repeat(64)}`;
const dat: SoftwareCatalogGame = {
  id: key,
  catalogId: key,
  catalogProvider: 'dat',
  source: 'DAT',
  title: 'Super Mario Bros.',
  coverUrl: '',
  summary: '',
  releaseDate: '',
  platforms: ['NES'],
  platformOptions: [{ key: 'nes', name: 'NES' }],
  genres: [],
};
const cover = 'https://images.igdb.com/igdb/image/upload/t_cover_big/co123.jpg';
const igdb: SoftwareCatalogGame = {
  ...dat,
  id: 'igdb-1',
  catalogId: '1',
  catalogProvider: 'igdb',
  source: 'IGDB',
  igdbId: 1,
  coverUrl: cover,
  platformOptions: [{ id: 18, name: 'NES' }],
};
const systems = [
  {
    slug: 'nes',
    name: 'NES',
    media: 'rom',
    extensions: ['.nes'],
    max_size_mb: 4,
  },
];
const platforms = [{ id: 18, name: 'NES' }];
beforeEach(() => cacheManager.getCache('romarr').flush());

it('adds an exact platform-matched cover while preserving DAT identity and input', async () => {
  let searches = 0;
  const source = {
    getArtworkPlatforms: async () => platforms,
    searchArtwork: async (title: string, ids: number[]) => {
      searches++;
      assert.equal(title, dat.title);
      assert.deepEqual(ids, [18]);
      return {
        results: [igdb, { ...igdb, igdbId: 2, title: 'Super Mario Bros. 3' }],
      };
    },
  };
  const [result] = await enrichDatCatalogArtwork(
    [dat],
    source,
    systems,
    {},
    'test'
  );
  assert.deepEqual(result, { ...dat, coverUrl: cover });
  assert.equal(dat.coverUrl, '');
  await enrichDatCatalogArtwork([dat], source, systems, {}, 'test');
  assert.equal(searches, 1);
});

it('rejects wrong platforms, ambiguous exact matches and unsafe artwork', async () => {
  for (const [index, results] of [
    [{ ...igdb, platformOptions: [{ id: 19, name: 'SNES' }] }],
    [igdb, { ...igdb, igdbId: 2, coverUrl: '' }],
    [{ ...igdb, coverUrl: 'http://127.0.0.1/private.jpg' }],
    [{ ...igdb, title: 'Super Mario Bros. 3' }],
  ].entries()) {
    const source = {
      getArtworkPlatforms: async () => platforms,
      searchArtwork: async () => ({ results }),
    };
    const [result] = await enrichDatCatalogArtwork(
      [dat],
      source,
      systems,
      {},
      `test-${index}`
    );
    assert.equal(result.coverUrl, '');
  }
});

it('preserves browsing and briefly backs off when the metadata provider fails', async () => {
  let calls = 0;
  const source = {
    getArtworkPlatforms: async () => {
      calls++;
      throw new Error('metadata unavailable');
    },
    searchArtwork: async () => ({ results: [] }),
  };
  assert.deepEqual(
    await enrichDatCatalogArtwork([dat], source, systems, {}, 'test'),
    [dat]
  );
  await enrichDatCatalogArtwork([dat], source, systems, {}, 'test');
  assert.equal(calls, 1);
});

it('bounds slow metadata and aborts outstanding requests without changing results later', async () => {
  let signal: AbortSignal | undefined;
  let finish!: (value: { results: SoftwareCatalogGame[] }) => void;
  const source = {
    getArtworkPlatforms: async () => platforms,
    searchArtwork: async (
      _title: string,
      _ids: number[],
      requestSignal: AbortSignal
    ) => {
      signal = requestSignal;
      return new Promise<{ results: SoftwareCatalogGame[] }>((resolve) => {
        finish = resolve;
      });
    },
  };
  const result = await enrichDatCatalogArtwork(
    [dat],
    source,
    systems,
    {},
    'test',
    20
  );
  assert.equal(signal?.aborted, true);
  finish({ results: [igdb] });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(result, [dat]);
});

it('does not look up non-DAT games or replace existing covers', async () => {
  const source = {
    getArtworkPlatforms: async () => {
      throw new Error('must not call');
    },
    searchArtwork: async () => ({ results: [] }),
  };
  assert.deepEqual(
    await enrichDatCatalogArtwork(
      [igdb, { ...dat, coverUrl: cover }],
      source,
      systems,
      {},
      'test'
    ),
    [igdb, { ...dat, coverUrl: cover }]
  );
});
