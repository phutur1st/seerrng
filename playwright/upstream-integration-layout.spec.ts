import { expect, test, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

const loginAsAdmin = async (page: Page, baseURL: string | undefined) => {
  const response = await page
    .context()
    .request.post(`${baseURL}/api/v1/auth/local`, {
      data: { email: 'admin@seerr.dev', password: 'test1234' },
      headers: { 'X-Forwarded-Proto': 'https' },
    });
  expect(response.status()).toBe(200);
  const sid = response
    .headersArray()
    .find((header) => header.name.toLowerCase() === 'set-cookie')
    ?.value.match(/^connect\.sid=([^;]+)/)?.[1];
  expect(sid).toBeTruthy();
  await page.context().addCookies([
    {
      name: 'connect.sid',
      value: sid!,
      url: baseURL!,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
};

for (const width of [1440, 390]) {
  test(`series cards preserve shared roles and independent navigation at ${width}px`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await loginAsAdmin(page, baseURL);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const title = 'A Long Fixture Series with Several Independent Formats';
    const variant = {
      key: 'library',
      title,
      serverName: 'Fixture Bookshelf',
      format: 'ebook',
      source: 'library',
      href: '/book-series/1',
    };
    await page.route('**/api/v1/book-series/search?**', (route) =>
      route.fulfill({
        json: {
          status: 'ok',
          truncated: false,
          results: [
            {
              ...variant,
              variants: [
                variant,
                {
                  ...variant,
                  key: 'catalog',
                  source: 'catalog',
                  format: 'audiobook',
                  href: '/book-series/catalog?serverId=0&scope=series&providerId=fixture',
                },
              ],
            },
          ],
        },
      })
    );
    await page.route('**/api/v1/book-series/covers?**', (route) =>
      route.fulfill({
        json: {
          books: Array.from({ length: 12 }, (_, index) => ({
            title: `Fixture Book ${index + 1}`,
          })),
        },
      })
    );
    await page.route('**/api/v1/book-series/1', (route) =>
      route.fulfill({
        json: {
          id: 1,
          title,
          serverName: 'Fixture Bookshelf',
          format: 'ebook',
          scope: 'backend-library',
          truncated: false,
          entries: [
            {
              providerId: 'work:1',
              title: 'Unmatched Fixture Book',
              isbns: [],
              primary: true,
              matchStatus: 'unmatched',
            },
          ],
        },
      })
    );
    await page.route('**/api/v1/book-series/catalog?**', (route) =>
      route.fulfill({
        json: {
          title,
          serverName: 'Fixture Bookshelf',
          format: 'audiobook',
          bookCount: 1,
          resolutionTruncated: false,
          books: [
            { title: 'Unmatched Fixture Book', matchStatus: 'unmatched' },
          ],
        },
      })
    );
    await page.route('**/api/v1/book-series/watch?**', (route) =>
      route.fulfill({ json: { supported: false } })
    );
    await page.goto('/book-series?query=fixture');
    await expect(page.locator('.page-title:visible')).toHaveCount(1);
    await expect(page.locator('.page-title')).toHaveCSS(
      'font-size',
      width < 640 ? '24px' : '36px'
    );
    const card = page.locator('[data-choice-layout="linked"]').first();
    await expect(card).toBeVisible();
    expect(
      await card.evaluate((node) => ({
        actual: getComputedStyle(node).paddingLeft,
        token: getComputedStyle(node)
          .getPropertyValue('--inset-card-padding')
          .trim(),
      }))
    ).toEqual({ actual: '8px', token: '8px' });
    const track = card.locator('[data-list-layout="covers"]');
    await expect(track).toBeVisible();
    const thumb = track.locator('.cover-thumb').first();
    await expect(thumb).toHaveCSS('aspect-ratio', '2 / 3');
    const next = card.getByRole('button', { name: 'Next Book Covers' });
    await expect(next).toBeEnabled();
    await next.click();
    await expect
      .poll(() => track.evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(0);
    await expect(page).toHaveURL(/\/book-series\?query=fixture$/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `${process.env.SHOT_DIR ?? 'test-results'}/series-search-${width}.png`,
      fullPage: true,
    });
    await card.getByRole('link', { name: 'Audiobooks', exact: true }).click();
    await expect(page).toHaveURL(/\/book-series\/catalog\?/);
    await expect(page.locator('.page-title:visible')).toHaveText(title);
    await expect(
      page.getByText('Unmatched Fixture Book', { exact: true })
    ).toBeVisible();
    await page.goto('/book-series/1');
    await expect(page.locator('.page-title:visible')).toHaveText(title);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `${process.env.SHOT_DIR ?? 'test-results'}/series-details-${width}.png`,
      fullPage: true,
    });
    expect(pageErrors).toEqual([]);
  });

  test(`OIDC provider name and separate help link fit at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('**/api/v1/settings/public', async (route) => {
      const response = await route.fetch();
      const settings = await response.json();
      await route.fulfill({
        response,
        json: {
          ...settings,
          openIdProviders: [
            {
              slug: 'authentik',
              name: 'Hom3lab Authentik Identity Provider',
            },
          ],
        },
      });
    });
    await page.goto('/login');
    const provider = page.locator('[data-list-layout="auth-provider"]');
    await expect(provider.getByRole('button')).toContainText(
      'Hom3lab Authentik'
    );
    await expect(provider.getByRole('link')).toHaveAttribute(
      'href',
      /docs\.goauthentik\.io/
    );
    await expect(provider.locator('[data-provider-part="logo"]')).toHaveCSS(
      'width',
      '20px'
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `${process.env.SHOT_DIR ?? 'test-results'}/oidc-login-${width}.png`,
      fullPage: true,
    });
  });
}

for (const width of [1440, 390]) {
  test(`administrators can reopen guided setup at ${width}px`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await loginAsAdmin(page, baseURL);
    await page.goto('/settings/services');
    await page
      .getByRole('link', { name: 'Open Guided Setup', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Set Defaults for New Users' })
    ).toBeVisible();
    await page.goto('/setup?guide=1');
    await expect(
      page.getByRole('heading', { name: 'Set Defaults for New Users' })
    ).toBeVisible();
    await page.screenshot({
      path: `${process.env.SHOT_DIR ?? 'test-results'}/setup-defaults-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole('button', { name: 'Skip for Now', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'What Would You Like to Connect?' })
    ).toBeVisible();
    const choice = page
      .locator('.media-choice-card[data-choice-layout="stacked"]')
      .first();
    await expect(choice.locator('.card-body-text').first()).toHaveCSS(
      'white-space',
      'normal'
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: `${process.env.SHOT_DIR ?? 'test-results'}/setup-connections-${width}.png`,
      fullPage: true,
    });
  });
}
