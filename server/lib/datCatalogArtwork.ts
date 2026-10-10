import type { RomarrPlatform } from '@server/api/software/romarrng';
import type {
  SoftwareCatalogGame,
  SoftwareCatalogPlatform,
} from '@server/api/software/types';
import cacheManager from './cache';
import { getAutomaticCatalogPlatform } from './softwareCatalogPlatformMapping';

interface ArtworkSource {
  getArtworkPlatforms(signal: AbortSignal): Promise<SoftwareCatalogPlatform[]>;
  searchArtwork(
    title: string,
    platformIds: number[],
    signal: AbortSignal
  ): Promise<{ results: SoftwareCatalogGame[] }>;
}

// Keep sequel numbers and words: fuzzy matches can silently show the wrong box.
const normalizeTitle = (title: string) =>
  title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const safeCover = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.origin === 'https://images.igdb.com' &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

/** Artwork is optional; its identity must never replace the DAT request key. */
export async function enrichDatCatalogArtwork<T extends SoftwareCatalogGame>(
  games: T[],
  source: ArtworkSource,
  systems: RomarrPlatform[],
  mappings: Record<string, number>,
  scope: string,
  budgetMs = 3000
): Promise<T[]> {
  const cache = cacheManager.getCache('romarr').data;
  const output = games.map((game) => ({ ...game }));
  const pending: number[] = [];
  output.forEach((game, index) => {
    if (game.catalogProvider !== 'dat' || game.coverUrl) return;
    const cover = cache.get<string>(`${scope}:cover:${game.catalogId}`);
    if (cover !== undefined) game.coverUrl = cover;
    else pending.push(index);
  });
  if (!pending.length || cache.get<boolean>(`${scope}:unavailable`))
    return output;

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve();
    }, budgetMs);
  });
  const work = async () => {
    try {
      const platforms = await source.getArtworkPlatforms(controller.signal);
      const platformIds = new Map(
        systems.map((system) => [
          system.slug,
          mappings[system.slug] ??
            getAutomaticCatalogPlatform(system, platforms)?.id,
        ])
      );
      const worker = async () => {
        while (pending.length && !controller.signal.aborted) {
          const index = pending.shift()!;
          const game = output[index];
          const ids = [
            ...new Set(
              game.platformOptions
                .map((option) =>
                  option.key ? platformIds.get(option.key) : undefined
                )
                .filter(
                  (id): id is number =>
                    Number.isSafeInteger(id) && (id ?? 0) > 0
                )
            ),
          ];
          if (!ids.length) continue;
          const page = await source.searchArtwork(
            game.title,
            ids,
            controller.signal
          );
          if (controller.signal.aborted) return;
          const matches = new Map(
            page.results
              .filter(
                (candidate) =>
                  normalizeTitle(candidate.title) ===
                    normalizeTitle(game.title) &&
                  candidate.platformOptions.some(
                    (option) =>
                      option.id !== undefined && ids.includes(option.id)
                  ) &&
                  Number.isSafeInteger(candidate.igdbId)
              )
              .map((candidate) => [candidate.igdbId, candidate.coverUrl])
          );
          const cover =
            matches.size === 1 && safeCover([...matches.values()][0])
              ? [...matches.values()][0]
              : '';
          cache.set(
            `${scope}:cover:${game.catalogId}`,
            cover,
            cover ? 86400 : 3600
          );
          game.coverUrl = cover;
        }
      };
      await Promise.all([worker(), worker()]);
    } catch {
      // A metadata outage must not become a DAT catalog outage or a retry storm.
      cache.set(`${scope}:unavailable`, true, 30);
      controller.abort();
    }
  };
  try {
    await Promise.race([work(), deadline]);
    return output.map((game) => ({ ...game }));
  } finally {
    clearTimeout(timer!);
    controller.abort();
  }
}
