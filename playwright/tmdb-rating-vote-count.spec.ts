import { expect, test, type Page } from '@playwright/test';

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
};

for (const media of [
  { name: 'movies', path: '/discover/movies', api: '/api/v1/discover/movies' },
  { name: 'series', path: '/discover/tv', api: '/api/v1/discover/tv' },
]) {
  test(`${media.name} TMDB rating sort applies a minimum vote count`, async ({
    page,
    baseURL,
  }) => {
    await loginAsAdmin(page, baseURL);
    await page.route(`**${media.api}**`, (route) =>
      route.fulfill({
        json: { page: 1, totalPages: 0, totalResults: 0, results: [] },
      })
    );

    const discoverRequest = page.waitForRequest((request) => {
      if (!request.url().includes(media.api)) return false;

      const query = new URL(request.url()).searchParams;
      return query.get('sortBy') === 'vote_average.desc';
    });
    await page.goto(media.path);
    const sortSection = page.getByRole('region', { name: 'Sort By' });
    await sortSection
      .getByRole('button', { name: 'Sort By', exact: true })
      .click();
    await sortSection.getByRole('button', { name: 'TMDB Rating' }).click();
    const request = await discoverRequest;
    expect(new URL(request.url()).searchParams.get('voteCountGte')).toBe('50');
  });
}
