type MediaType = 'movie' | 'tv';

type TitleDetailsOptions = {
  id: number;
  mediaType: MediaType;
  title: string;
  date: string;
  overview?: string;
  details?: Record<string, unknown>;
};

export const stubTitleDetails = ({
  id,
  mediaType,
  title,
  date,
  overview = 'A title used by a deterministic browser fixture.',
  details: overrides = {},
}: TitleDetailsOptions) => {
  const summary = {
    id,
    mediaType,
    posterPath: null,
    overview,
    ...(mediaType === 'movie'
      ? { title, originalTitle: title, releaseDate: date }
      : { name: title, originalName: title, firstAirDate: date }),
  };
  const mediaDetails = {
    ...summary,
    originalLanguage: 'en',
    backdropPath: null,
    genreIds: [],
    credits: { cast: [], crew: [] },
    productionCompanies: [],
    productionCountries: [],
    spokenLanguages: [],
    genres: [],
    keywords: [],
    relatedVideos: [],
    externalIds: {},
    releases: { results: [] },
    contentRatings: { results: [] },
    mediaInfo: null,
    seasons: [],
    createdBy: [],
    episodeRunTime: [],
    networks: [],
    status: 'Released',
    ...overrides,
  };

  cy.intercept('GET', `/api/v1/${mediaType}/${id}`, mediaDetails).as(
    'fixtureTitleDetails'
  );
  cy.intercept('GET', `**/_next/data/*/${mediaType}/${id}.json*`, {
    pageProps: { [mediaType]: mediaDetails },
    __N_SSP: true,
  });

  return { summary, mediaDetails };
};

export const openTitleDetailsFromSearch = (options: TitleDetailsOptions) => {
  const { summary } = stubTitleDetails(options);
  cy.intercept('GET', '/api/v1/search*', {
    page: 1,
    totalPages: 1,
    totalResults: 1,
    results: [summary],
  }).as('fixtureTitleSearch');

  // Route through the client so the provider response is supplied by this test;
  // a direct page visit would fetch metadata during server-side rendering.
  cy.visit(`/search?query=${encodeURIComponent(options.title)}`);
  cy.wait('@fixtureTitleSearch');
  cy.get('[data-testid="title-card"]').first().click();
  return cy
    .get('[data-testid="media-title"]')
    .should('contain.text', options.title);
};
