import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  for (const route of [
    '/share',
    '/following',
    '/discover/games',
    '/discover/vibes',
  ]) {
    test(`cross-media cards preserve shared padding on ${route} at ${viewport.width}px`, async ({
      page,
      baseURL,
    }) => {
      await page.setViewportSize(viewport);
      const response = await page
        .context()
        .request.post(`${baseURL}/api/v1/auth/local`, {
          data: { email: 'admin@seerr.dev', password: 'test1234' },
          headers: { 'X-Forwarded-Proto': 'https' },
        });
      expect(response.status()).toBe(200);
      const cookie = response
        .headersArray()
        .find(
          (header) =>
            header.name.toLowerCase() === 'set-cookie' &&
            header.value.startsWith('connect.sid=')
        )
        ?.value.match(/^connect\.sid=([^;]+)/)?.[1];
      expect(cookie).toBeTruthy();
      await page.context().addCookies([
        {
          name: 'connect.sid',
          value: cookie!,
          url: baseURL!,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ]);
      await page.route('**/api/v1/resolve/capabilities', (r) =>
        r.fulfill({
          json: { text: false, image: false, maxImageBytes: 8388608 },
        })
      );
      await page.route('**/api/v1/follow**', (r) =>
        r.fulfill({ json: { total: 0, results: [] } })
      );
      await page.route('**/api/v1/vibes', (r) =>
        r.fulfill({ json: { configured: false, results: [], vibes: [] } })
      );
      await page.route('**/api/v1/game-content/saved', (r) =>
        r.fulfill({ json: { results: [] } })
      );
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.app-card-main').first()).toBeVisible();
      const cards = await page
        .locator('.app-card-main')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const style = getComputedStyle(element);
            const expected = style
              .getPropertyValue('--main-card-padding')
              .trim();
            return {
              actual: [
                style.paddingTop,
                style.paddingRight,
                style.paddingBottom,
                style.paddingLeft,
              ],
              expected,
            };
          })
        );
      for (const card of cards) {
        expect(parseFloat(card.expected)).toBeGreaterThan(0);
        expect(card.actual).toEqual(Array(4).fill(card.expected));
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    });
  }
}
