import axios from 'axios';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { beforeEach, expect, it, vi } from 'vitest';
import SoftwareSearchPreview from './SoftwareSearchPreview';

const state = vi.hoisted(() => ({
  settings: {
    softwareEnabled: false,
    romarrEnabled: true,
    emulationCatalogEnabled: true,
    enabledMediaCategories: { retro: true, modern: false, game: true },
  },
  games: [] as object[],
  fetcher: undefined as undefined | (() => Promise<unknown>),
  key: undefined as unknown,
}));

vi.mock('@app/hooks/useSettings', () => ({
  default: () => ({ currentSettings: state.settings }),
}));
vi.mock('swr', () => ({
  default: (key: unknown, fetcher: () => Promise<unknown>) => {
    state.key = key;
    state.fetcher = fetcher;
    return { data: state.games };
  },
}));
vi.mock('@app/components/Common/CachedImage', () => ({ default: () => null }));
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: { pathname: string; query: Record<string, string> };
    children: React.ReactNode;
  }) => (
    <a href={`${href.pathname}?${new URLSearchParams(href.query)}`}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  state.settings.emulationCatalogEnabled = true;
  state.games = [];
  state.key = undefined;
  state.fetcher = undefined;
});

function render() {
  return renderToStaticMarkup(
    <IntlProvider locale="en">
      <SoftwareSearchPreview query="Super Mario" />
    </IntlProvider>
  );
}

it('searches the enabled ROMarrNG category without QuestarrNG and retains distinct DAT titles', async () => {
  const games = [
    {
      catalogProvider: 'dat',
      catalogId: `dat-${'a'.repeat(64)}`,
      title: 'Super Mario Bros.',
    },
    {
      catalogProvider: 'dat',
      catalogId: `dat-${'b'.repeat(64)}`,
      title: 'Super Mario Bros. 2',
    },
  ];
  const get = vi
    .spyOn(axios, 'get')
    .mockResolvedValue({ data: { results: games } });
  render();
  expect(state.key).toEqual([
    'software-search-preview',
    'Super Mario',
    'retro',
  ]);
  const result = await state.fetcher?.();
  expect(result).toHaveLength(2);
  expect(get).toHaveBeenCalledTimes(1);
  expect(get).toHaveBeenCalledWith(
    '/api/v1/request/software/catalog/search?category=retro&q=Super%20Mario&limit=4'
  );
});

it('links DAT previews to their own provider and catalog identity', () => {
  const first = `dat-${'a'.repeat(64)}`;
  const second = `dat-${'b'.repeat(64)}`;
  state.games = [
    {
      category: 'retro',
      catalogProvider: 'dat',
      catalogId: first,
      title: 'First title',
    },
    {
      category: 'retro',
      catalogProvider: 'dat',
      catalogId: second,
      title: 'Second title',
    },
  ];
  const markup = render();
  expect(markup).toContain(`game=${first}&amp;catalogProvider=dat`);
  expect(markup).toContain(`game=${second}&amp;catalogProvider=dat`);
  expect(markup).toContain('First title');
  expect(markup).toContain('Second title');
});

it('does not request catalog results when no enabled provider is configured', () => {
  state.settings.emulationCatalogEnabled = false;
  render();
  expect(state.key).toBeNull();
});
