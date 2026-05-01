import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadAllControls, loadModules, type AppliesTo } from '@iwc/controls';
import { ControlsTable } from '../../_components/ControlsTable';

const TIER_SLUGS = ['ordinary', 'qeaa', 'pub-eaa'] as const;
type TierSlug = (typeof TIER_SLUGS)[number];

function isTierSlug(s: string): s is TierSlug {
  return (TIER_SLUGS as readonly string[]).includes(s);
}

const SLUG_TO_TIER: Record<TierSlug, AppliesTo> = {
  ordinary: 'ordinary-eaa',
  qeaa: 'qeaa',
  'pub-eaa': 'pub-eaa',
};

const TIER_LABEL: Record<TierSlug, string> = {
  ordinary: 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
};

const TIER_DESCRIPTION: Record<TierSlug, string> = {
  ordinary:
    'Controls that an Ordinary EAA must meet. The baseline tier for any EUDI Wallet attestation.',
  qeaa:
    'Controls that a Qualified EAA (QEAA) must meet, in addition to the Ordinary tier. QEAAs are signed with a qualified electronic signature or seal under eIDAS 2.',
  'pub-eaa':
    'Controls that a PuB-EAA (issued by or on behalf of a public body responsible for an authentic source) must meet, in addition to the Ordinary tier.',
};

interface PageProps {
  params: Promise<{ module: string; tier: string }>;
}

export async function generateStaticParams() {
  const modules = await loadModules();
  const shipped = modules.filter((m) => m.status === 'shipped');
  return shipped.flatMap((m) =>
    TIER_SLUGS.map((t) => ({ module: m.id, tier: t })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { module: moduleSlug, tier } = await params;
  if (!isTierSlug(tier)) return {};
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleSlug);
  if (!m) return {};
  const tierValue = SLUG_TO_TIER[tier];
  const controls = await loadAllControls();
  const filtered = controls.filter(
    (c) => c.module === moduleSlug && c.applies_to.includes(tierValue),
  );
  const url = `/modules/${moduleSlug}/tiers/${tier}/`;
  const tierName = TIER_LABEL[tier];
  return {
    title: `${tierName} controls · ${m.name} · iGrant.io`,
    description: `${filtered.length} ${tierName} control${filtered.length === 1 ? '' : 's'} in the ${m.name} module.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${tierName} controls · ${m.name}`,
      description: `${filtered.length} controls in the ${m.name} module that apply to the ${tierName} tier.`,
      type: 'website',
      url,
    },
  };
}

export default async function TierFilteredPage({ params }: PageProps) {
  const { module: moduleSlug, tier } = await params;
  if (!isTierSlug(tier)) notFound();
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleSlug);
  if (!m) notFound();
  const tierValue = SLUG_TO_TIER[tier];
  const controls = await loadAllControls();
  const filtered = controls.filter(
    (c) => c.module === moduleSlug && c.applies_to.includes(tierValue),
  );
  const tierName = TIER_LABEL[tier];

  return (
    <article className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          <Link href={`/modules/${m.id}/`} className="hover:underline">
            {m.name}
          </Link>
          <span className="mx-2 text-zinc-400" aria-hidden="true">/</span>
          Tier filter
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          {tierName} controls
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {TIER_DESCRIPTION[tier]}
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          {filtered.length} {filtered.length === 1 ? 'control' : 'controls'}{' '}
          in the {m.name} module apply to this tier.
        </p>
      </header>

      <div className="pt-8">
        <ControlsTable
          controls={filtered}
          moduleSlug={m.id}
          emptyTitle={`No ${tierName} controls catalogued yet.`}
          emptyHint="The catalogue grows as new tiers are populated. Check back soon."
        />
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
        <Link
          href={`/modules/${m.id}/controls/`}
          className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
        >
          Open the full controls catalogue
          <span aria-hidden="true" className="ml-1">&gt;</span>
        </Link>
        <Link
          href={`/modules/${m.id}/`}
          className="text-zinc-600 hover:text-blue-700 hover:underline dark:text-zinc-400 dark:hover:text-blue-300"
        >
          <span aria-hidden="true" className="mr-1">&larr;</span>
          Back to {m.name}
        </Link>
      </footer>
    </article>
  );
}
