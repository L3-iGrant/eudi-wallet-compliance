import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { loadAllControls, loadModules } from '@iwc/controls';
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
  const rows: CatalogueRow[] = allControls
    .filter((c) => c.module === moduleSlug)
    .map((c) => ({
      id: c.id,
      slug: controlIdToSlug(c.id),
      short_title: c.short_title,
      modal_verb: c.modal_verb,
      applies_to: c.applies_to,
      profile: c.profile,
      role: c.role,
      evidence_type: c.evidence_type,
      clause: c.spec_source.clause,
    }));

  return (
    <article className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          {m.name}
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          Controls catalogue
        </h1>
        <p className="mt-3 max-w-3xl text-base text-zinc-600 dark:text-zinc-400">
          Filter by profile, role, tier, or modal verb. Search by ID or title.
          Export the filtered set as CSV, JSON, or YAML. Filter state lives in
          the URL, so a configured view is shareable.
        </p>
      </header>

      <div className="pt-8">
        <Suspense fallback={null}>
          <CatalogueTable rows={rows} moduleSlug={m.id} totalLabel={m.name} />
        </Suspense>
      </div>
    </article>
  );
}
