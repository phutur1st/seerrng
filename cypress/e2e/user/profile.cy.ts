// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths -- Cypress specs use deterministic local title fixtures.
import { stubTitleDetails } from '../../support/titleFixtures';

describe('User Profile', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('opens user profile page from the home page', () => {
    cy.visit('/');

    cy.get('[data-testid=user-menu]').click();
    cy.get('[data-testid=user-menu-profile]').click();

    cy.env<{ ADMIN_EMAIL: string }>(['ADMIN_EMAIL']).then(({ ADMIN_EMAIL }) => {
      cy.get('h1').should('contain', ADMIN_EMAIL);
    });
  });

  it('opens Advanced Theme from self user settings', () => {
    cy.visit('/users/1/settings/main');

    cy.get('[data-testid=settings-nav-desktop]')
      .contains('Advanced Theme')
      .should('have.attr', 'href', '/profile/advanced-theme')
      .click();

    cy.location('pathname').should('eq', '/profile/advanced-theme');
    cy.contains('h1', 'Advanced Theme Overrides').should('be.visible');
  });

  for (const metadataTiming of ['before', 'after'] as const) {
    it(`loads plex watchlist with metadata ${metadataTiming} the visibility check`, () => {
      cy.intercept('/api/v1/user/[0-9]*/watchlist', {
        fixture: 'watchlist.json',
      }).as('getWatchlist');
      const { mediaDetails } = stubTitleDetails({
        id: 361743,
        mediaType: 'movie',
        title: 'Top Gun: Maverick',
        date: '2022-05-27',
      });

      let releaseMetadata: () => void = () => undefined;
      const metadataReady = new Cypress.Promise<void>((resolve) => {
        releaseMetadata = resolve;
        if (metadataTiming === 'before') resolve();
      });
      cy.intercept('GET', '/api/v1/movie/361743', (request) =>
        metadataReady.then(() => request.reply(mediaDetails))
      ).as('fixtureTitleDetails');

      cy.visit('/profile');

      cy.wait('@getWatchlist');

      // Metadata replaces the lazy-loading wrapper. Re-query the actual poster
      // rather than asserting visibility on a detached observer target.
      const getWatchlistCard = () =>
        cy
          .contains('.slider-header', 'Watchlist')
          .closest('[data-testid=media-slider]')
          .find('[data-testid=title-card]')
          .first();

      getWatchlistCard().scrollIntoView();
      const assertVisiblePoster = () =>
        getWatchlistCard()
          .should('be.visible')
          .should(($poster) => {
            const target = $poster[0];
            expect(target.isConnected, 'current poster is attached').to.eq(
              true
            );
            const bounds = target.getBoundingClientRect();
            const window = target.ownerDocument.defaultView;
            if (!window)
              throw new Error('Watchlist poster has no browsing context');
            expect(bounds.width, 'poster width').to.be.greaterThan(0);
            expect(bounds.height, 'poster height').to.be.greaterThan(0);
            expect(
              bounds.right,
              'poster crosses viewport left edge'
            ).to.be.greaterThan(0);
            expect(
              bounds.bottom,
              'poster crosses viewport top edge'
            ).to.be.greaterThan(0);
            expect(
              bounds.left,
              'poster crosses viewport right edge'
            ).to.be.lessThan(window.innerWidth);
            expect(
              bounds.top,
              'poster crosses viewport bottom edge'
            ).to.be.lessThan(window.innerHeight);
          });

      if (metadataTiming === 'after') {
        assertVisiblePoster();
        cy.then(() => releaseMetadata());
      }

      cy.wait('@fixtureTitleDetails')
        .its('response.statusCode')
        .should('eq', 200);
      assertVisiblePoster();

      cy.contains('.slider-header', 'Watchlist')
        .closest('[data-testid=media-slider]')
        .find('[data-testid=title-card]')
        .first()
        .trigger('mouseover')
        .find('[data-testid=title-card-title]')
        .invoke('text')
        .then((text) => {
          cy.contains('.slider-header', 'Watchlist')
            .closest('[data-testid=media-slider]')
            .find('[data-testid=title-card]')
            .first()
            .click();
          cy.get('[data-testid=media-title]').should('contain', text);
        });
    });
  }
});
