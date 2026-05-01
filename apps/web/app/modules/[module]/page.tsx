import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  loadAllControls,
  loadModules,
  type Control,
  type ModuleMetadata,
} from '@iwc/controls';
import { ChevronRight } from '../../_components/ChevronRight';

interface PageProps {
  params: Promise<{ module: string }>;
}

const REVIEW_DATE = '2026-05-01';

const PROFILE_LABEL: Record<string, string> = {
  'sd-jwt-vc': 'SD-JWT VC',
  mdoc: 'mdoc',
  abstract: 'Abstract',
};

const ROLE_LABEL: Record<string, string> = {
  issuer: 'Issuer',
  verifier: 'Verifier',
  wallet: 'Wallet',
  rp: 'Relying Party',
  qtsp: 'QTSP',
  all: 'All',
};

const TIER_LABEL: Record<string, string> = {
  'ordinary-eaa': 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
  all: 'All',
};

const TIER_SLUG: Record<string, string> = {
  'ordinary-eaa': 'ordinary',
  qeaa: 'qeaa',
  'pub-eaa': 'pub-eaa',
};

// Hand-written scope summary, "what's tested", and "beyond ETSI" copy keyed
// by module id. New shipped modules add an entry here.
interface ShippedCopy {
  scope: string;
  whats_tested: string[];
  beyond_etsi: string[];
}

const SHIPPED_COPY: Record<string, ShippedCopy> = {
  'eaa-conformance': {
    scope:
      'Covers the SD-JWT VC profile of Electronic Attestations of Attributes ' +
      '(EAA), with parallel coverage of cross-cutting requirements that apply ' +
      'regardless of profile. Both Issuer and Verifier roles are exercised, ' +
      'across Ordinary EAA, QEAA, and PuB-EAA tiers. Around 90 ' +
      'individually-numbered controls are extracted directly from the ' +
      'underlying ETSI specs, each linked back to its clause and page.',
    whats_tested: [
      'Every normative requirement in ETSI TS 119 472-1 clauses 4 and 5 that ' +
        'the engine can verify against an EAA artefact (payload, JOSE header, ' +
        'issuer certificate, status list, or type metadata).',
      'Cross-cutting controls in clause 4 that apply uniformly across both ' +
        'SD-JWT VC and mdoc, surfaced once in the catalogue rather than ' +
        'duplicated per profile.',
      'Tier-aware scoring: the same EAA is checked against Ordinary, QEAA, ' +
        'and PuB-EAA rule sets in a single pass, with a gap analysis for the ' +
        'tiers it would not yet meet.',
    ],
    beyond_etsi: [
      'Plain-English explanations and a curated list of common mistakes for ' +
        'every control. The ETSI specification carries the normative text ' +
        'only; the rest is iGrant.io editorial.',
      'Open-source check functions you can drop into your own CI, rather ' +
        'than only consume through a hosted assessment.',
      'A live, public catalogue page per control with stable URLs, so spec ' +
        'IDs are linkable from issue trackers, design documents, and audit ' +
        'reports.',
    ],
  },
};

export async function generateStaticParams() {
  const modules = await loadModules();
  return modules.map((m) => ({ module: m.id }));
}

async function findModule(slug: string): Promise<ModuleMetadata | null> {
  const modules = await loadModules();
  return modules.find((m) => m.id === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { module: moduleSlug } = await params;
  const m = await findModule(moduleSlug);
  if (!m) return {};
  const url = `/modules/${m.id}/`;
  const isShipped = m.status === 'shipped';
  const description = isShipped
    ? `${m.short_description} Browse the controls catalogue and run the EUDI Wallet Self-Assessment for this module.`
    : `${m.short_description} (Module currently in development.)`;
  return {
    title: `${m.name} · EUDI Wallet Compliance · iGrant.io`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${m.name} · EUDI Wallet Compliance`,
      description,
      type: 'website',
      url,
    },
  };
}

interface CountsByFacet {
  total: number;
  byProfile: Map<string, number>;
  byRole: Map<string, number>;
  byTier: Map<string, number>;
  byModalVerb: Map<string, number>;
}

function tally(controls: Control[]): CountsByFacet {
  const counts: CountsByFacet = {
    total: controls.length,
    byProfile: new Map(),
    byRole: new Map(),
    byTier: new Map(),
    byModalVerb: new Map(),
  };
  for (const c of controls) {
    counts.byModalVerb.set(
      c.modal_verb,
      (counts.byModalVerb.get(c.modal_verb) ?? 0) + 1,
    );
    for (const p of c.profile) {
      counts.byProfile.set(p, (counts.byProfile.get(p) ?? 0) + 1);
    }
    for (const r of c.role) {
      counts.byRole.set(r, (counts.byRole.get(r) ?? 0) + 1);
    }
    for (const t of c.applies_to) {
      counts.byTier.set(t, (counts.byTier.get(t) ?? 0) + 1);
    }
  }
  return counts;
}

function StatBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

function FacetRow({
  title,
  basePath,
  entries,
  total,
  slugMap,
}: {
  title: string;
  basePath: string;
  entries: Array<{ key: string; label: string; count: number }>;
  total: number;
  slugMap?: Record<string, string>;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        {title}
      </h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {entries.map((e) => {
          const slug = slugMap?.[e.key] ?? e.key;
          const href = `${basePath}/${slug}/`;
          const percent = total > 0 ? Math.round((e.count / total) * 100) : 0;
          return (
            <li key={e.key}>
              <Link
                href={href}
                className="group inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
              >
                <span className="font-medium">{e.label}</span>
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-600 group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-blue-900/40 dark:group-hover:text-blue-300">
                  {e.count}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {percent}%
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function buildEntries(
  counts: Map<string, number>,
  labels: Record<string, string>,
  ordering: string[],
): Array<{ key: string; label: string; count: number }> {
  const known = ordering
    .filter((k) => counts.has(k))
    .map((k) => ({ key: k, label: labels[k] ?? k, count: counts.get(k) ?? 0 }));
  // Append any keys present in counts but not in `ordering`, just in case.
  for (const [k, v] of counts.entries()) {
    if (!ordering.includes(k)) {
      known.push({ key: k, label: labels[k] ?? k, count: v });
    }
  }
  return known;
}

export default async function ModulePage({ params }: PageProps) {
  const { module: moduleSlug } = await params;
  const m = await findModule(moduleSlug);
  if (!m) notFound();

  if (m.status !== 'shipped') {
    return <UpcomingModule module={m} />;
  }

  const allControls = await loadAllControls();
  const moduleControls = allControls.filter((c) => c.module === m.id);
  const counts = tally(moduleControls);
  const copy = SHIPPED_COPY[m.id];

  const profileEntries = buildEntries(counts.byProfile, PROFILE_LABEL, [
    'sd-jwt-vc',
    'mdoc',
    'abstract',
  ]);
  const roleEntries = buildEntries(counts.byRole, ROLE_LABEL, [
    'issuer',
    'verifier',
    'wallet',
    'rp',
    'qtsp',
    'all',
  ]);
  const tierEntries = buildEntries(counts.byTier, TIER_LABEL, [
    'ordinary-eaa',
    'qeaa',
    'pub-eaa',
    'all',
  ]);
  const basePath = `/modules/${m.id}`;

  return (
    <article className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      {/* Header */}
      <header className="border-b border-zinc-200 pb-10 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          Module · Shipped
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl dark:text-white">
          {m.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
          {m.spec_sources.join(' · ')}
        </p>
      </header>

      {/* Scope */}
      <section className="grid grid-cols-1 gap-12 pt-10 lg:grid-cols-3 lg:gap-16">
        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
            Scope
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
            {copy?.scope ?? m.short_description}
          </p>
        </div>
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Run the assessment
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              Upload an EAA, pick the role and tier you are checking against,
              get a control-by-control conformance report. No login.
            </p>
            <Link
              href="/eudi-wallet-compliance/self-assessment/"
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Run the Self-Assessment
              <ChevronRight className="ml-1.5" />
            </Link>
          </div>
        </aside>
      </section>

      {/* Controls overview */}
      <section className="mt-16">
        <div className="flex flex-col gap-2 sm:max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            Controls overview
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
            {counts.total} controls catalogued.
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Each row in the catalogue links to a public, stable URL. Filter by
            profile, role, tier, or modal verb below, or open the full
            catalogue.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBlock label="Total controls" value={counts.total} />
          <StatBlock
            label="Shall"
            value={counts.byModalVerb.get('shall') ?? 0}
            hint="Mandatory"
          />
          <StatBlock
            label="Should"
            value={counts.byModalVerb.get('should') ?? 0}
            hint="Recommended"
          />
          <StatBlock
            label="May"
            value={counts.byModalVerb.get('may') ?? 0}
            hint="Optional"
          />
        </div>

        <div className="mt-8 space-y-7">
          <FacetRow
            title="By profile"
            basePath={`${basePath}/profiles`}
            entries={profileEntries}
            total={counts.total}
          />
          <FacetRow
            title="By role"
            basePath={`${basePath}/roles`}
            entries={roleEntries}
            total={counts.total}
          />
          <FacetRow
            title="By tier"
            basePath={`${basePath}/tiers`}
            entries={tierEntries}
            total={counts.total}
            slugMap={TIER_SLUG}
          />
        </div>

        <div className="mt-8">
          <Link
            href={`${basePath}/controls/`}
            className="inline-flex items-center text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            Open the full controls catalogue
            <ChevronRight className="ml-1" />
          </Link>
        </div>
      </section>

      {/* What's tested vs. what we go beyond */}
      {copy && (
        <section className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
              What we test
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
              Every normative rule, mechanically.
            </h3>
            <ul className="mt-4 space-y-3">
              {copy.whats_tested.map((s, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                  />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
              What we add beyond ETSI
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
              The bits the spec leaves implicit.
            </h3>
            <ul className="mt-4 space-y-3">
              {copy.beyond_etsi.map((s, idx) => (
                <li
                  key={idx}
                  className="flex gap-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                  />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Spec sources
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {m.spec_sources.map((src) => (
            <li key={src}>
              <a
                href={specPortalLink(src)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
              >
                {src}
                <span aria-hidden="true" className="ml-1">↗</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
          Last reviewed against the listed spec sources on {REVIEW_DATE}.
        </p>
      </footer>
    </article>
  );
}

function UpcomingModule({ module: m }: { module: ModuleMetadata }) {
  const statusLabel =
    m.status === 'in-development' ? 'In development' : 'Planned';
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
        Module · {statusLabel}
      </p>
      <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl dark:text-white">
        {m.name}
      </h1>
      <p className="mt-6 text-base leading-relaxed text-zinc-700 sm:text-lg dark:text-zinc-300">
        {m.short_description}
      </p>

      <section className="mt-10 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900/40">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Notify me when this launches
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          Email capture lands here in a future iteration. For now, please
          reach out to the iGrant.io team if you want to pilot this module
          ahead of public release.
        </p>
        <a
          href="https://igrant.io/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Talk to iGrant.io
          <ChevronRight className="ml-1.5" />
        </a>
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Anchored to
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {m.spec_sources.map((src) => (
            <li
              key={src}
              className="text-zinc-700 dark:text-zinc-300"
            >
              {src}
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link
            href="/"
            className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
          >
            <span aria-hidden="true" className="mr-1">&larr;</span>
            Back to all modules
          </Link>
        </p>
      </section>
    </article>
  );
}

function specPortalLink(src: string): string {
  // Best-effort linker. ETSI specs go to their portal; everything else falls
  // back to a search query so the link is never dead.
  if (/^ETSI TS \d+/.test(src)) {
    return `https://www.etsi.org/standards-search?text=${encodeURIComponent(src)}`;
  }
  if (/^ETSI EN \d+/.test(src)) {
    return `https://www.etsi.org/standards-search?text=${encodeURIComponent(src)}`;
  }
  return `https://duckduckgo.com/?q=${encodeURIComponent(src)}`;
}
