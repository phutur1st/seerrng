import { expect, test } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

for (const width of [1440, 390]) {
  test(`approved episode preferences retain shared control geometry at ${width}px`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page
      .context()
      .request.post(`${baseURL}/api/v1/auth/local`, {
        data: { email: 'admin@seerr.dev', password: 'test1234' },
        headers: { 'X-Forwarded-Proto': 'https' },
      });
    expect(response.status()).toBe(200);
    const sid = response
      .headersArray()
      .find(({ name }) => name.toLowerCase() === 'set-cookie')
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
    await page.route('**/api/v1/user/1/settings/episode-queue', (route) =>
      route.fulfill({
        json: { status: 'approved', requestedAt: null, defaultEpisodeCount: 2 },
      })
    );
    await page.goto('/profile/settings/episode-queue');
    const select = page.locator('#episode-queue-default-count');
    await expect(select).toBeVisible();
    await expect(select).toHaveValue('2');
    const geometry = await select.evaluate((node) => {
      const field = getComputedStyle(node);
      const card = node.closest('.app-card-inset')!;
      const button = card.querySelector('button')!;
      const action = getComputedStyle(button);
      const header = document.querySelector('[data-action-layout=summary]')!;
      const copy = header
        .querySelector('[data-card-layout=copy]')!
        .getBoundingClientRect();
      const badge = header.lastElementChild!.getBoundingClientRect();
      const rootSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );
      const tokenPixels = (value: string) =>
        parseFloat(value) * (value.trim().endsWith('rem') ? rootSize : 1);
      return {
        copyBottom: copy.bottom,
        copyX: copy.x,
        badgeY: badge.y,
        badgeX: badge.x,
        height: parseFloat(field.height),
        expectedHeight: tokenPixels(
          field.getPropertyValue('--compact-control-height')
        ),
        actionHeight: parseFloat(action.height),
        expectedActionHeight: tokenPixels(
          action.getPropertyValue('--action-control-height')
        ),
        actionWidth: button.getBoundingClientRect().width,
        cardWidth: card.getBoundingClientRect().width,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    if (width < 640)
      expect(geometry.badgeY).toBeGreaterThanOrEqual(geometry.copyBottom);
    else expect(geometry.badgeX).toBeGreaterThan(geometry.copyX);
    expect(geometry.height).toBe(geometry.expectedHeight);
    expect(geometry.actionHeight).toBe(geometry.expectedActionHeight);
    expect(geometry.actionWidth).toBeLessThan(geometry.cardWidth);
    expect(geometry.overflow).toBe(false);
  });
}
