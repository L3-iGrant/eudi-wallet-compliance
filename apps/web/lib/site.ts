/**
 * Canonical site URL used everywhere absolute URLs are needed (sitemap,
 * robots, OG images, JSON-LD). Override at build time via the
 * NEXT_PUBLIC_SITE_URL env var.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eudi-wallet-compliance.igrant.io';

export function absoluteUrl(path: string): string {
  const base = SITE_URL.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
