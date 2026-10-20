import { expect, test, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const loginAsAdmin = async (page: Page, baseURL: string | undefined) => {
  expect(baseURL).toBeTruthy();
  const loginResponse = await page
    .context()
    .request.post(`${baseURL}/api/v1/auth/local`, {
      data: { email: 'admin@seerr.dev', password: 'test1234' },
      headers: { 'X-Forwarded-Proto': 'https' },
    });
  expect(loginResponse.status()).toBe(200);

  const sessionCookie = loginResponse
    .headersArray()
    .find(
      (header) =>
        header.name.toLowerCase() === 'set-cookie' &&
        header.value.startsWith('connect.sid=')
    )
    ?.value.match(/^connect\.sid=([^;]+)/)?.[1];
  expect(sessionCookie).toBeTruthy();

  await page.context().addCookies([
    {
      name: 'connect.sid',
      value: sessionCookie!,
      url: baseURL!,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  const currentUserResponse = await page
    .context()
    .request.get(`${baseURL}/api/v1/auth/me`);
  expect(currentUserResponse.status()).toBe(200);
  return currentUserResponse.json() as Promise<{
    id: number;
    displayName: string;
  }>;
};

// MediaStatus: 1 unknown, 3 processing, 4 partially available, 5 available.
// MediaRequestStatus: 2 approved, 5 completed.
const scenarios = [
  {
    name: 'finished season request',
    requestStatus: 5,
    seasonRequestStatus: 5,
    requestedSeasonLibraryStatus: 5,
    expected: 'Available',
    unexpected: 'Processing',
  },
  {
    name: 'downloading season request',
    requestStatus: 2,
    seasonRequestStatus: 2,
    requestedSeasonLibraryStatus: 3,
    expected: 'Processing',
    unexpected: 'Available',
  },
];

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'narrow', width: 390, height: 844 },
]) {
  for (const scenario of scenarios) {
    test(`recent ${scenario.name} on a partially available series at ${viewport.name} width`, async ({
      page,
      baseURL,
    }, testInfo) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      const user = await loginAsAdmin(page, baseURL);
      const tmdbId = 987001;
      // Season 1 is owned, season 2 is the request, season 3 is missing, so
      // the series stays partially available whatever happens to season 2.
      const media = {
        id: 987002,
        mediaType: 'tv',
        tmdbId,
        status: 4,
        status4k: 1,
        seasons: [
          { id: 1, seasonNumber: 1, status: 5, status4k: 1 },
          {
            id: 2,
            seasonNumber: 2,
            status: scenario.requestedSeasonLibraryStatus,
            status4k: 1,
          },
          { id: 3, seasonNumber: 3, status: 1, status4k: 1 },
        ],
        downloadStatus: [],
        downloadStatus4k: [],
        identifiers: [],
      };
      const request = {
        id: 987003,
        type: 'tv',
        status: scenario.requestStatus,
        is4k: false,
        createdAt: '2026-10-20T00:42:06.000Z',
        updatedAt: '2026-10-20T01:00:01.000Z',
        requestedBy: { id: user.id, displayName: user.displayName, avatar: '' },
        modifiedBy: { id: user.id, displayName: user.displayName, avatar: '' },
        seasons: [
          {
            id: 4,
            seasonNumber: 2,
            status: scenario.seasonRequestStatus,
          },
        ],
        media,
        serverId: 0,
        profileId: 1,
        rootFolder: '/tv',
        tags: [],
      };
      const series = {
        id: tmdbId,
        name: 'Season Scope Fixture',
        firstAirDate: '2001-11-06',
        posterPath: null,
        backdropPath: null,
        seasons: [1, 2, 3].map((seasonNumber) => ({
          id: seasonNumber,
          seasonNumber,
          name: `Season ${seasonNumber}`,
          episodeCount: 24,
        })),
        mediaInfo: media,
      };

      let listFixtureApplied = false;
      await page.route('**/api/v1/request?*', async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname !== '/api/v1/request') return route.fallback();
        listFixtureApplied = true;
        await route.fulfill({
          json: {
            pageInfo: { pages: 1, pageSize: 10, results: 1, page: 1 },
            results: [request],
          },
        });
      });
      await page.route(`**/api/v1/request/${request.id}`, (route) =>
        route.fulfill({ json: request })
      );
      await page.route(`**/api/v1/tv/${tmdbId}`, (route) =>
        route.fulfill({ json: series })
      );

      await page.goto('/');
      const card = page
        .getByTestId('request-card')
        .filter({ hasText: series.name })
        .first();
      await expect(card).toBeVisible({ timeout: 30_000 });
      expect(listFixtureApplied).toBe(true);

      const statusControl = card.locator('.request-status-control').first();
      await expect(statusControl).toContainText(scenario.expected);
      await expect(statusControl).not.toContainText(scenario.unexpected);

      await card.scrollIntoViewIfNeeded();
      await testInfo.attach(`${scenario.name}-${viewport.name}`, {
        body: await card.screenshot({
          path: testInfo.outputPath('request-card.png'),
        }),
        contentType: 'image/png',
      });
    });
  }
}
