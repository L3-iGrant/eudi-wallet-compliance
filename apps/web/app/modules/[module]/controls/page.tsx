import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { loadAllControls, loadModules } from '@iwc/controls';
import { AUTO_TESTED_IDS } from '@iwc/controls/sync';
import { controlIdToSlug } from '@iwc/shared';
import {
  CatalogueTable,
  type CatalogueRow,
} from './_components/CatalogueTable';

interface PageProps {
  params: Promise<{ module: string }>;
}

export async function generateStaticParams() {
  const modules = await loadModules();
  return modules
    .filter((m) => m.status === 'shipped')
    .map((m) => ({ module: m.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { module: moduleSlug } = await params;
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleSlug);
  if (!m) return {};
  return {
    title: `Controls catalogue · ${m.name} · iGrant.io`,
    description: `Filterable, exportable catalogue of all ${m.name} controls.`,
    alternates: { canonical: `/modules/${moduleSlug}/controls/` },
    openGraph: {
      title: `${m.name} controls catalogue`,
      description: `Filterable, exportable catalogue of all ${m.name} controls.`,
      type: 'website',
      url: `/modules/${moduleSlug}/controls/`,
    },
  };
}

export default async function ControlsCataloguePage({ params }: PageProps) {
  const { module: moduleSlug } = await params;
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleSlug);
  if (!m) notFound();

  const allControls = await loadAllControls();
  const moduleControls = allControls.filter((c) => c.module === moduleSlug);
  const autoTestedSet = new Set(AUTO_TESTED_IDS);
  const rows: CatalogueRow[] = moduleControls.map((c) => ({
    id: c.id,
    slug: controlIdToSlug(c.id),
    short_title: c.short_title,
    requirement_level: c.requirement_level,
    applies_to: c.applies_to,
    profile: c.profile,
    role: c.role,
    evidence_type: c.evidence_type,
    clause: c.spec_source.clause,
    auto_tested: autoTestedSet.has(c.id),
  }));
  const autoTestedCount = rows.filter((r) => r.auto_tested).length;

  // Deduplicate spec sources across the module's controls. The kicker shows
  // the spec citation when there is exactly one (so it never lies about
  // multi-document modules), and a short attribution line below the intro
  // tells the reader without forcing them to inspect a row.
  const uniqueSources = Array.from(
    new Map(
      moduleControls.map((c) => [
        `${c.spec_source.document}|${c.spec_source.version}`,
        { document: c.spec_source.document, version: c.spec_source.version },
      ]),
    ).values(),
  );
  const singleSource = uniqueSources.length === 1 ? uniqueSources[0] : null;

  return (
    <article className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          {m.name}
          {singleSource && (
            <>
              <span className="mx-2 text-zinc-400" aria-hidden="true">/</span>
              {singleSource.document} ({singleSource.version})
            </>
          )}
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          Controls catalogue
        </h1>
        <p className="mt-3 max-w-3xl text-base text-zinc-600 dark:text-zinc-400">
          Filter by profile, role, tier, or requirement level. Search by ID or title.
          Export the filtered set as CSV, JSON, or YAML. Filter state lives in
          the URL, so a configured view is shareable.
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          <span
            aria-hidden="true"
            className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle"
          />
          {autoTestedCount} of {rows.length} controls are auto-tested when you
          run an assessment.
        </p>
        {/* Single-source modules already get attributed in the kicker above.
            Multi-source modules need a compact, scannable list. Chips read
            as a glanceable inventory without making per-source claims about
            which rows came from which document. */}
        {uniqueSources.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Spec sources
            </span>
            {uniqueSources.map((s) => (
              <span
                key={`${s.document}-${s.version}`}
                className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {s.document} ({s.version})
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="pt-8">
        <Suspense fallback={null}>
          <CatalogueTable rows={rows} moduleSlug={m.id} totalLabel={m.name} />
        </Suspense>
      </div>
    </article>
  );
}
