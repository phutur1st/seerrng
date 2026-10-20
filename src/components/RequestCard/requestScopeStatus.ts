import { MediaRequestStatus, MediaStatus } from '@server/constants/media';

type TvRequestScope = {
  status: MediaRequestStatus;
  is4k: boolean;
  seasons?: {
    seasonNumber: number;
    status: MediaRequestStatus;
    episodeNumbers?: number[] | null;
  }[];
  media: {
    status: MediaStatus;
    status4k: MediaStatus;
    seasons?: {
      seasonNumber: number;
      status: MediaStatus;
      status4k: MediaStatus;
    }[];
  };
};

/**
 * Availability of what a TV request asked for, rather than the whole series.
 *
 * A series stays partially available while unrequested seasons are missing, so
 * the series status alone cannot tell a finished season request from one that
 * is still processing. Each requested season must be confirmed by the
 * library's own season status; the request's completion alone is not enough.
 * Episode selections can complete inside a partially available season.
 */
export const getTvRequestScopeStatus = (
  request: TvRequestScope
): MediaStatus => {
  const seriesStatus = request.media[request.is4k ? 'status4k' : 'status'];
  const requestedSeasons = (request.seasons ?? []).filter(
    (season) => season.status !== MediaRequestStatus.DECLINED
  );
  const librarySeasons = request.media.seasons;

  if (
    seriesStatus === MediaStatus.DELETED ||
    seriesStatus === MediaStatus.BLOCKLISTED ||
    !requestedSeasons.length ||
    !librarySeasons?.length
  ) {
    return seriesStatus;
  }

  const satisfied = requestedSeasons.filter((requested) => {
    const library = librarySeasons.find(
      (season) => season.seasonNumber === requested.seasonNumber
    );
    const libraryStatus = library?.[request.is4k ? 'status4k' : 'status'];

    return (
      libraryStatus === MediaStatus.AVAILABLE ||
      (libraryStatus === MediaStatus.PARTIALLY_AVAILABLE &&
        !!requested.episodeNumbers?.length &&
        requested.status === MediaRequestStatus.COMPLETED)
    );
  });

  if (satisfied.length === requestedSeasons.length) {
    return MediaStatus.AVAILABLE;
  }

  if (satisfied.length) {
    return MediaStatus.PARTIALLY_AVAILABLE;
  }

  return seriesStatus;
};
