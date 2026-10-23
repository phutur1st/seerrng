import { Permission } from '@server/lib/permissions';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

afterEach(() => vi.unstubAllGlobals());
const run = async (path: string, permissions: number, initialized = true) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      String(url).endsWith('/settings/public')
        ? Response.json({ initialized })
        : Response.json({ permissions })
    )
  );
  return proxy(
    new NextRequest(`http://localhost:5055${path}`, {
      headers: { cookie: 'connect.sid=fixture' },
    })
  );
};

describe('initialized guided setup routing', () => {
  it('admits an authenticated administrator to the explicit guide', async () => {
    const response = await run('/setup?guide=1', Permission.ADMIN);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
  it('keeps ordinary authenticated users out of the guide', async () => {
    expect(
      (await run('/setup?guide=1', Permission.REQUEST)).headers.get('location')
    ).toBe('http://localhost:5055/');
  });
  it('retains initialized setup and login redirects without the explicit guide', async () => {
    for (const path of ['/setup', '/setup?guide=0', '/login']) {
      expect((await run(path, Permission.ADMIN)).headers.get('location')).toBe(
        'http://localhost:5055/'
      );
    }
  });
  it('does not authorize malformed permission claims', async () => {
    for (const permissions of [undefined, null, '2', NaN]) {
      expect(
        (
          await run('/setup?guide=1', permissions as unknown as number)
        ).headers.get('location')
      ).toBe('http://localhost:5055/');
    }
  });
  it('preserves the uninitialized public setup flow', async () => {
    expect(
      (await run('/setup', Permission.NONE, false)).headers.get(
        'x-middleware-next'
      )
    ).toBe('1');
  });
});
