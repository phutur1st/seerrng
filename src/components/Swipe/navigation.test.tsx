import type * as UserHook from '@app/hooks/useUser';
import { JSDOM } from 'jsdom';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Swipe from './index';

const state = vi.hoisted(() => ({
  router: {
    isReady: true,
    query: {} as Record<string, string>,
    asPath: '/swipe',
    replace: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  },
  mediaTypes: ['tv'],
}));

vi.mock('next/router', () => ({ useRouter: () => state.router }));
vi.mock('@app/hooks/useToasts', () => ({
  default: () => ({ addToast: vi.fn() }),
}));
vi.mock('@app/hooks/useUser', async (importOriginal) => ({
  ...(await importOriginal<typeof UserHook>()),
  useUser: () => ({ hasPermission: () => true }),
}));
vi.mock('swr', () => ({
  default: (key: string | null) => ({
    data:
      key === '/api/v1/swipe/status'
        ? { mediaTypes: state.mediaTypes, enabled: true }
        : key?.startsWith('/api/v1/swipe/deck')
          ? { cards: [], remaining: 0 }
          : undefined,
    mutate: vi.fn(),
    isValidating: false,
  }),
  useSWRConfig: () => ({ mutate: vi.fn() }),
}));

let dom: JSDOM;
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/swipe',
  });
  vi.stubGlobal('window', dom.window);
  vi.stubGlobal('self', dom.window);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  state.router.isReady = true;
  state.router.query = {
    mediaType: 'tv',
    returnTo: '/discover/tv/genre/18?sortBy=popularity.desc&page=2',
  };
  state.mediaTypes = ['tv'];
  state.router.replace.mockReset();
});

afterEach(async () => {
  await act(async () => root.unmount());
  dom.window.close();
  vi.unstubAllGlobals();
});

const render = () =>
  act(async () => {
    root.render(
      <IntlProvider locale="en">
        <Swipe />
      </IntlProvider>
    );
  });

it('preserves a valid requested deck and its filtered return path during initialization', async () => {
  await render();
  expect(state.router.replace).not.toHaveBeenCalled();
  expect(
    container
      .querySelector('[data-testid="discovery-mode-tab-discover"]')
      ?.getAttribute('href')
  ).toBe(state.router.query.returnTo);
  expect(
    container.querySelector('[role="tab"][aria-selected="true"]')?.textContent
  ).toBe('Series');
});

it('waits for router hydration before replacing an unavailable deck', async () => {
  state.router.isReady = false;
  state.router.query = {};
  await render();
  expect(state.router.replace).not.toHaveBeenCalled();

  state.router.isReady = true;
  state.router.query = { mediaType: 'tv' };
  await render();
  expect(state.router.replace).not.toHaveBeenCalled();
});

it('still selects an available deck when the requested type is unavailable', async () => {
  state.router.query = { mediaType: 'book' };
  await render();
  expect(state.router.replace).toHaveBeenCalledWith(
    {
      pathname: '/swipe',
      query: { mediaType: 'tv', returnTo: '/discover/tv' },
    },
    undefined,
    { shallow: true, scroll: false }
  );
});

it('uses the matching discovery page when the user switches media types', async () => {
  state.mediaTypes = ['movie', 'tv'];
  await render();
  const movieTab = Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  ).find((tab) => tab.textContent === 'Movies');
  expect(movieTab).toBeDefined();
  await act(async () => movieTab?.click());
  expect(state.router.replace).toHaveBeenCalledWith(
    {
      pathname: '/swipe',
      query: { mediaType: 'movie', returnTo: '/discover/movies' },
    },
    undefined,
    { shallow: true, scroll: false }
  );
});
