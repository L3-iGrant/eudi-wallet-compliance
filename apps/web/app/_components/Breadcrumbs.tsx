'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbsProps {
  // Caller may pass a list of canonical control IDs so the final segment of a
  // control URL renders as the canonical id (e.g. EAA-5.2.10.1-04) rather than
  // its slug. Prompt 3 wires this up via @iwc/shared's slugToControlId. Until
  // then the heuristic in slugToDisplayId() is used.
  controls?: Array<{ id: string }>;
}

const ROUTE_LABELS: Record<string, string> = {
  'self-assessment': 'Self-Assessment',
  modules: 'Modules',
  controls: 'Controls',
  profiles: 'Profiles',
  roles: 'Roles',
  tiers: 'Tiers',
  docs: 'Docs',
  'reference-samples': 'Reference Samples',
};

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

function buildCrumbs(pathname: string, controls?: Array<{ id: string }>): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ href: '/', label: 'Compliance' }];

  let href = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i] ?? '';
    href += `/${segment}`;
    const previous = segments[i - 1];

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
  }

  return crumbs;
}

export function Breadcrumbs({ controls }: BreadcrumbsProps) {
  const pathname = usePathname() ?? '/';
  if (pathname === '/') return null;

  const crumbs = buildCrumbs(pathname, controls);
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
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-1">
              {idx > 0 && (
                <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-600">
                  /
                </span>
              )}
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
