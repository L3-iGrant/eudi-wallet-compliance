/**
 * Engine-neutral search interface. The current implementation wraps
 * Pagefind, but a future provider (e.g. Typesense) can satisfy the same
 * contract by mapping its native types into SearchHit and accepting the
 * same SearchOptions. UI code should depend on these types only.
 */

export interface SearchHit {
  /** Stable, engine-specific record identifier. */
  id: string;
  /** Absolute path to navigate to (e.g. /modules/.../controls/eaa-5-2-10-1-04/). */
  url: string;
  /** Display title for the hit. */
  title: string;
  /**
   * HTML excerpt with the matched terms wrapped in <mark>. Render with
   * dangerouslySetInnerHTML; the engine returns sanitised content.
   */
  excerpt: string;
  /** Free-form metadata, e.g. control_id, module, short_title. */
  meta: Record<string, string | undefined>;
  /** Facet values (e.g. profile=['sd-jwt-vc'], role=['issuer']). */
  filters: Record<string, string[]>;
}

export interface SearchOptions {
  /**
   * Filter constraints. Within a key, values are OR'd; across keys, AND'd.
   * Engines that do not support filters should ignore this and rely on
   * the query string alone.
   */
  filters?: Record<string, string[]>;
  /** Hard cap on results. Default 10. */
  limit?: number;
}

export interface SearchProvider {
  /**
   * One-time initialisation (loading the index, opening a connection, etc).
   * Idempotent.
   */
  init(): Promise<void>;

  /**
   * Run a search. An empty or whitespace-only query MUST return [] without
   * hitting the engine, so the overlay can render its empty state cheaply.
   */
  search(query: string, options?: SearchOptions): Promise<SearchHit[]>;
}
