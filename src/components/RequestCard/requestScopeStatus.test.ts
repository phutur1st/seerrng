import { MediaRequestStatus, MediaStatus } from '@server/constants/media';
import assert from 'node:assert/strict';
import test from 'node:test';
import { getTvRequestScopeStatus } from './requestScopeStatus';

const librarySeasons = (statuses: MediaStatus[]) =>
  statuses.map((status, index) => ({
    seasonNumber: index + 1,
    status,
    status4k: MediaStatus.UNKNOWN,
  }));

const seasonRequest = (
  request: Partial<Parameters<typeof getTvRequestScopeStatus>[0]> & {
    seasons: Parameters<typeof getTvRequestScopeStatus>[0]['seasons'];
    library: MediaStatus[];
  }
) =>
  getTvRequestScopeStatus({
    status: MediaRequestStatus.COMPLETED,
    is4k: false,
    ...request,
    media: {
      status: MediaStatus.PARTIALLY_AVAILABLE,
      status4k: MediaStatus.UNKNOWN,
      seasons: librarySeasons(request.library),
    },
  });

test('a finished season request is available while other seasons are missing', () => {
  assert.equal(
    seasonRequest({
      seasons: [{ seasonNumber: 2, status: MediaRequestStatus.COMPLETED }],
      library: [
        MediaStatus.AVAILABLE,
        MediaStatus.AVAILABLE,
        MediaStatus.UNKNOWN,
      ],
    }),
    MediaStatus.AVAILABLE
  );
});

test('a requested season still downloading keeps the series status', () => {
  assert.equal(
    seasonRequest({
      status: MediaRequestStatus.APPROVED,
      seasons: [{ seasonNumber: 3, status: MediaRequestStatus.APPROVED }],
      library: [
        MediaStatus.AVAILABLE,
        MediaStatus.AVAILABLE,
        MediaStatus.PROCESSING,
      ],
    }),
    MediaStatus.PARTIALLY_AVAILABLE
  );
});

test('request completion alone does not claim missing library seasons', () => {
  assert.equal(
    seasonRequest({
      seasons: [{ seasonNumber: 2, status: MediaRequestStatus.COMPLETED }],
      library: [MediaStatus.AVAILABLE, MediaStatus.UNKNOWN],
    }),
    MediaStatus.PARTIALLY_AVAILABLE
  );
});

test('some requested seasons available reports partial availability', () => {
  assert.equal(
    seasonRequest({
      status: MediaRequestStatus.APPROVED,
      seasons: [
        { seasonNumber: 1, status: MediaRequestStatus.COMPLETED },
        { seasonNumber: 2, status: MediaRequestStatus.APPROVED },
      ],
      library: [MediaStatus.AVAILABLE, MediaStatus.PROCESSING],
    }),
    MediaStatus.PARTIALLY_AVAILABLE
  );
});

test('declined season selections are outside the requested scope', () => {
  assert.equal(
    seasonRequest({
      seasons: [
        { seasonNumber: 1, status: MediaRequestStatus.COMPLETED },
        { seasonNumber: 2, status: MediaRequestStatus.DECLINED },
      ],
      library: [MediaStatus.AVAILABLE, MediaStatus.UNKNOWN],
    }),
    MediaStatus.AVAILABLE
  );
});

test('completed episode selections count inside a partially available season', () => {
  assert.equal(
    seasonRequest({
      seasons: [
        {
          seasonNumber: 1,
          status: MediaRequestStatus.COMPLETED,
          episodeNumbers: [1, 2],
        },
      ],
      library: [MediaStatus.PARTIALLY_AVAILABLE],
    }),
    MediaStatus.AVAILABLE
  );
  assert.equal(
    seasonRequest({
      status: MediaRequestStatus.APPROVED,
      seasons: [
        {
          seasonNumber: 1,
          status: MediaRequestStatus.APPROVED,
          episodeNumbers: [1, 2],
        },
      ],
      library: [MediaStatus.PARTIALLY_AVAILABLE],
    }),
    MediaStatus.PARTIALLY_AVAILABLE
  );
});

test('4K requests use 4K season availability', () => {
  assert.equal(
    getTvRequestScopeStatus({
      status: MediaRequestStatus.COMPLETED,
      is4k: true,
      seasons: [{ seasonNumber: 1, status: MediaRequestStatus.COMPLETED }],
      media: {
        status: MediaStatus.AVAILABLE,
        status4k: MediaStatus.PARTIALLY_AVAILABLE,
        seasons: [
          {
            seasonNumber: 1,
            status: MediaStatus.AVAILABLE,
            status4k: MediaStatus.PROCESSING,
          },
        ],
      },
    }),
    MediaStatus.PARTIALLY_AVAILABLE
  );
});

test('deleted, blocklisted or season-less data keeps the series status', () => {
  for (const status of [MediaStatus.DELETED, MediaStatus.BLOCKLISTED]) {
    assert.equal(
      getTvRequestScopeStatus({
        status: MediaRequestStatus.COMPLETED,
        is4k: false,
        seasons: [{ seasonNumber: 1, status: MediaRequestStatus.COMPLETED }],
        media: {
          status,
          status4k: MediaStatus.UNKNOWN,
          seasons: librarySeasons([MediaStatus.AVAILABLE]),
        },
      }),
      status
    );
  }
  assert.equal(
    getTvRequestScopeStatus({
      status: MediaRequestStatus.COMPLETED,
      is4k: false,
      seasons: [{ seasonNumber: 1, status: MediaRequestStatus.COMPLETED }],
      media: {
        status: MediaStatus.PARTIALLY_AVAILABLE,
        status4k: MediaStatus.UNKNOWN,
      },
    }),
    MediaStatus.PARTIALLY_AVAILABLE
  );
});
