import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TMDB_RATING_MINIMUM_VOTES,
  prepareFilterValues,
  withDefaultTmdbRatingMinimumVotes,
} from './constants';

describe('TMDB rating vote-count defaults', () => {
  it('uses a fifty-vote minimum when sorting by rating', () => {
    expect(
      withDefaultTmdbRatingMinimumVotes({ sortBy: 'vote_average.desc' })
    ).toEqual({
      sortBy: 'vote_average.desc',
      voteCountGte: DEFAULT_TMDB_RATING_MINIMUM_VOTES,
    });
  });

  it('preserves an explicit choice to include any vote count', () => {
    const filters = prepareFilterValues({
      sortBy: 'vote_average.asc',
      voteCountGte: '0',
    });

    expect(withDefaultTmdbRatingMinimumVotes(filters)).toEqual({
      sortBy: 'vote_average.asc',
      voteCountGte: '0',
    });
  });

  it('does not add the rating default to other sorts', () => {
    expect(
      withDefaultTmdbRatingMinimumVotes({ sortBy: 'popularity.desc' })
    ).toEqual({ sortBy: 'popularity.desc' });
  });
});
