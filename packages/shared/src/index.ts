/**
 * Convert a control id like "EAA-5.2.10.1-04" or "PuB-EAA-5.6.3-02" into a
 * URL-safe slug: lowercase, dots replaced with dashes. Round-trip via
 * slugToControlId() requires the original catalogue.
 */
export function controlIdToSlug(id: string): string {
  return id.toLowerCase().replace(/\./g, '-');
}

/**
 * Resolve a slug back to its canonical control id by looking it up in the
 * supplied catalogue. Returns null if no entry matches.
 */
export function slugToControlId(
  slug: string,
  controls: ReadonlyArray<{ id: string }>,
): string | null {
  const normalised = slug.toLowerCase();
  const match = controls.find((c) => controlIdToSlug(c.id) === normalised);
  return match?.id ?? null;
}
