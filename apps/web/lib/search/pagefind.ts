import type { SearchHit, SearchOptions, SearchProvider } from './types';

interface PagefindModule {
  search(
    query: string,
    options?: { filters?: Record<string, string[] | string> },
  ): Promise<{
    results: Array<{
      id: string;
      data(): Promise<PagefindResultData>;
    }>;
  }>;
  options?(opts: Record<string, unknown>): Promise<void>;
}

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: Record<string, string | undefined>;
  filters?: Record<string, string[]>;
}

const PAGEFIND_PATH = '/pagefind/pagefind.js';

/**
 * Wraps Pagefind's lower-level JS API. We deliberately do not use
 * pagefind-ui so the search overlay component stays engine-neutral and
 * the only thing we have to swap to migrate to Typesense is this file.
 *
 * The Pagefind index is produced at build time (`pagefind --site out`)
 * and served from /pagefind/pagefind.js. We dynamic-import it at runtime
 * with a webpackIgnore comment so Next's bundler does not try to resolve
 * the URL at compile time.
 */
export class PagefindProvider implements SearchProvider {
  private module: PagefindModule | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.module) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      // Magic comment: ask Webpack/Turbopack to leave the dynamic import
      // alone so the runtime fetches /pagefind/pagefind.js as-is.
      const mod = (await import(
        /* webpackIgnore: true */ /* @vite-ignore */ PAGEFIND_PATH
      )) as unknown as PagefindModule;
      this.module = mod;
    })();
    return this.initPromise;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchHit[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    if (!this.module) await this.init();
    if (!this.module) return [];

    const limit = options?.limit ?? 10;
    const { results } = await this.module.search(trimmed, {
      filters: options?.filters,
    });

    const sliced = results.slice(0, limit);
    const data = await Promise.all(sliced.map((r) => r.data()));
    return data.map((d, i) => ({
      id: sliced[i]?.id ?? `${i}`,
      url: d.url,
      title:
        d.meta.short_title ??
        d.meta.title ??
        d.meta.control_id ??
        d.url,
      excerpt: d.excerpt,
      meta: d.meta,
      filters: d.filters ?? {},
    }));
  }
}
