'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface BreadcrumbsProps {
  // Caller may pass a list of canonical control IDs so the final segment of a
  // control URL renders as the canonical id (e.g. EAA-5.2.10.1-04) rather than
  // its slug. Prompt 3 wires this up via @iwc/shared's slugToControlId. Until
  // then the heuristic in slugToDisplayId() is used.
  controls?: Array<{ id: string }>;
}

const ROUTE_LABELS: Record<string, string> = {
  'self-assessment': 'Self-Assessment',
  upload: 'Upload',
  report: 'Report',
  modules: 'Modules',
  controls: 'Controls',
  profiles: 'Profiles',
  roles: 'Roles',
  tiers: 'Tiers',
  docs: 'Docs',
  'getting-started': 'Getting started',
  'evidence-types': 'Evidence types',
  'understanding-your-report': 'Understanding your report',
  methodology: 'Methodology',
  about: 'About',
  faq: 'FAQ',
  privacy: 'Privacy',
  'reference-samples': 'Reference Samples',
};

/**
 * Path segments that should not appear as their own crumb. Currently
 * just the toolkit namespace; the navbar brand already shows where
 * you are, so repeating it in the breadcrumb adds noise.
 */
const SKIP_SEGMENTS = new Set(['eudi-wallet-compliance']);

const MODULE_LABELS: Record<string, string> = {
  'eaa-conformance': 'EAA Conformance',
  'pid-lpid': 'PID and LPID',
  'wallet-attestation': 'Wallet Attestation',
  oid4vci: 'OpenID for Verifiable Credential Issuance',
  oid4vp: 'OpenID for Verifiable Presentations',
  qtsp: 'QTSP Operations',
  'trust-list': 'Trust List Publication',
};

const PROFILE_LABELS: Record<string, string> = {
  'sd-jwt-vc': 'SD-JWT VC',
  mdoc: 'mdoc',
  abstract: 'Abstract',
};

const ROLE_LABELS: Record<string, string> = {
  issuer: 'Issuer',
  verifier: 'Verifier',
  wallet: 'Wallet',
  rp: 'Relying Party',
  qtsp: 'QTSP',
  all: 'All Roles',
};

const TIER_LABELS: Record<string, string> = {
  ordinary: 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
};

// Best-effort slug→canonical-id reversal for control slugs when no catalogue
// is provided. Splits the slug into a leading alphabetic prefix (e.g. "eaa",
// "pub-eaa") and the trailing numeric clause + sequence segments, then
// re-uppercases the prefix and re-dots the clause. Casing inside multi-segment
// prefixes (e.g. "PuB") is lost; pass `controls` for an exact mapping.
function slugToDisplayId(slug: string): string {
  const parts = slug.split('-');
  const prefixParts: string[] = [];
  let i = 0;
  while (i < parts.length && /^[a-z]+$/.test(parts[i] ?? '')) {
    prefixParts.push((parts[i] ?? '').toUpperCase());
    i++;
  }
  const numericParts = parts.slice(i);
  const prefix = prefixParts.join('-');
  if (numericParts.length === 0) return prefix;
  if (numericParts.length === 1) return `${prefix}-${numericParts[0]}`;
  const seq = numericParts[numericParts.length - 1];
  const clause = numericParts.slice(0, -1).join('.');
  return `${prefix}-${clause}-${seq}`;
}

interface Crumb {
  href: string;
  label: string;
}

function buildCrumbs(
  pathname: string,
  searchParams: URLSearchParams,
  controls?: Array<{ id: string }>,
): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];

  let href = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i] ?? '';
    href += `/${segment}`;
    const previous = segments[i - 1];

    if (SKIP_SEGMENTS.has(segment)) continue;

    let label = ROUTE_LABELS[segment] ?? segment;

    if (previous === 'modules') {
      label = MODULE_LABELS[segment] ?? segment;
    } else if (previous === 'controls') {
      const match = controls?.find(
        (c) =>
          c.id.toLowerCase().replace(/\./g, '-') === segment.toLowerCase(),
      );
      label = match?.id ?? slugToDisplayId(segment);
    } else if (previous === 'profiles') {
      label = PROFILE_LABELS[segment] ?? segment;
    } else if (previous === 'roles') {
      label = ROLE_LABELS[segment] ?? segment;
    } else if (previous === 'tiers') {
      label = TIER_LABELS[segment] ?? segment;
    }

    crumbs.push({ href: `${href}/`, label });

    // After the Self-Assessment segment, inject the chosen module from
    // the URL search params so the user sees their flow context (e.g.
    // "Self-Assessment / EAA Conformance / Upload"). Only fires when the
    // module param is present (the upload step carries it; the report
    // step reads its scope from the stored report and does not).
    if (segment === 'self-assessment') {
      const moduleParam = searchParams.get('module');
      if (moduleParam) {
        const moduleLabel = MODULE_LABELS[moduleParam] ?? moduleParam;
        crumbs.push({
          href: `${href}/?${searchParams.toString()}`,
          label: moduleLabel,
        });
      }
    }
  }

  return crumbs;
}

function BreadcrumbsInner({ controls }: BreadcrumbsProps) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams() ?? new URLSearchParams();
  if (pathname === '/') return null;

  const crumbs = buildCrumbs(pathname, searchParams, controls);
  if (crumbs.length === 0) return null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: c.label,
      item: c.href,
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="border-b border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40">
      <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400">
        <li className="flex items-center gap-1">
          <Link
            href="/eudi-wallet-compliance/"
            aria-label="Home"
            title="EUDI Wallet Compliance"
            className="inline-flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white"
          >
            <HomeIcon className="h-3.5 w-3.5" />
          </Link>
        </li>
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1">
              <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-600">
                /
              </span>
              {isLast ? (
                <span aria-current="page" className="font-medium text-zinc-800 dark:text-zinc-200">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-zinc-900 hover:underline dark:hover:text-white">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  );
}

export function Breadcrumbs(props: BreadcrumbsProps) {
  // useSearchParams requires a Suspense boundary in static-export builds;
  // wrapping here means the layout can render <Breadcrumbs /> without
  // every page having to know.
  return (
    <Suspense fallback={null}>
      <BreadcrumbsInner {...props} />
    </Suspense>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
