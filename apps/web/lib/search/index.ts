import type { SearchProvider } from './types';
import { PagefindProvider } from './pagefind';

let cached: SearchProvider | null = null;

/**
 * Returns the active search provider. Cached for the lifetime of the
 * page so the index/connection only initialises once per session.
 *
 * To swap engines (e.g. to Typesense), implement SearchProvider in a
 * sibling file and change the constructor here. The overlay UI does not
 * need to change.
 */
export function getSearchProvider(): SearchProvider {
  if (!cached) {
    cached = new PagefindProvider();
  }
  return cached;
}

export type { SearchHit, SearchOptions, SearchProvider } from './types';
