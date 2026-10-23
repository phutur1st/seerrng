const openRequestFilterSection = (label: string) => {
  cy.get(`section[aria-label="${label}"]`)
    .find('button.detail-disclosure-button')
    .then(($button) => {
      if ($button.attr('aria-expanded') === 'false') cy.wrap($button).click();
    });
  cy.get(
    `section[aria-label="${label}"] button.detail-disclosure-button`
  ).should('have.attr', 'aria-expanded', 'true');
};

describe('Request Status', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  for (const parameter of ['requestId', 'softwareRequestId']) {
    it(`opens a notification link and preserves ${parameter}`, () => {
      const emptyStatus = {
        pageInfo: { page: 1, pages: 0, pageSize: 20, results: 0 },
        results: [],
        counts: {
          total: 0,
          active: 0,
          incomplete: 0,
          attention: 0,
          completed: 0,
          unavailable: 0,
          failed: 0,
        },
        olderCount: 0,
      };
      cy.intercept('GET', '/api/v1/request/status*', emptyStatus).as(
        'mediaStatus'
      );
      cy.intercept('GET', '/api/v1/request/software/status*', emptyStatus).as(
        'softwareStatus'
      );

      const link = `/requests/status?${parameter}=825`;
      cy.request(link).its('status').should('eq', 200);
      cy.visit(link);
      cy.location('pathname').should('eq', '/requests/status');
      cy.location('search').should('eq', `?${parameter}=825`);
      cy.get('[data-testid="page-header"]')
        .should('be.visible')
        .and('have.text', 'Requests');
      cy.wait(parameter === 'requestId' ? '@mediaStatus' : '@softwareStatus')
        .its('request.url')
        .then((url) => {
          const query = new URL(url).searchParams;
          expect(query.get('requestId')).to.eq('825');
          expect(query.get('skip')).to.eq('0');
          if (parameter === 'requestId') expect(query.get('take')).to.eq('1');
        });
    });
  }

  it('opens on all requests and lets users choose a history window', () => {
    cy.visit('/requests');
    openRequestFilterSection('Filters');

    cy.get('button[aria-label="Time Period"]')
      .should('be.visible')
      .and('contain', 'All time')
      .click();

    cy.contains('[role=option]', 'Last 14 days').click();
    cy.location('search').should('contain', 'timeFrame=14d');

    cy.get('button[aria-label="Time Period"]').click();
    cy.contains('[role=option]', 'All time').click();
    cy.location('search').should('not.contain', 'timeFrame=');

    openRequestFilterSection('Media Filters');
    cy.contains('button', 'Books').should('be.visible');
    cy.contains('button', 'Audiobooks').click();
    cy.location('search').should('contain', 'mediaType=audiobook');
    cy.contains('Showing requests for')
      .should('be.visible')
      .parent()
      .find('[title="Audiobook"]')
      .should('be.visible');
  });
});
