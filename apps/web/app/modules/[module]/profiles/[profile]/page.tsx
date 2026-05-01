import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadAllControls, loadModules, type Profile } from '@iwc/controls';
import { ControlsTable, PROFILE_LABEL } from '../../_components/ControlsTable';

const PROFILES = ['sd-jwt-vc', 'mdoc', 'abstract'] as const;
type ProfileSlug = (typeof PROFILES)[number];

function isProfileSlug(s: string): s is ProfileSlug {
  return (PROFILES as readonly string[]).includes(s);
}

interface PageProps {
  params: Promise<{ module: string; profile: string }>;
}

export async function generateStaticParams() {
  const modules = await loadModules();
  const shipped = modules.filter((m) => m.status === 'shipped');
  return shipped.flatMap((m) =>
    PROFILES.map((p) => ({ module: m.id, profile: p })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { module: moduleSlug, profile } = await params;
  if (!isProfileSlug(profile)) return {};
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleSlug);
  if (!m) return {};
  const controls = await loadAllControls();
  const filtered = controls.filter(
    (c) => c.module === moduleSlug && c.profile.includes(profile as Profile),
  );
  const url = `/modules/${moduleSlug}/profiles/${profile}/`;
  const profileName = PROFILE_LABEL[profile];
  return {
    title: `${profileName} controls · ${m.name} · iGrant.io`,
    description: `${filtered.length} ${profileName} control${filtered.length === 1 ? '' : 's'} in the ${m.name} module.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${profileName} controls · ${m.name}`,
      description: `${filtered.length} controls in the ${m.name} module under the ${profileName} profile.`,
      type: 'website',
      url,
    },
  };
}

export default async function ProfileFilteredPage({ params }: PageProps) {
  const { module: moduleSlug, profile } = await params;
  if (!isProfileSlug(profile)) notFound();
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleSlug);
  if (!m) notFound();
  const controls = await loadAllControls();
  const filtered = controls.filter(
    (c) => c.module === moduleSlug && c.profile.includes(profile as Profile),
  );
  const profileName = PROFILE_LABEL[profile];

  return (
    <article className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          <Link
            href={`/modules/${m.id}/`}
            className="hover:underline"
          >
            {m.name}
          </Link>
          <span className="mx-2 text-zinc-400" aria-hidden="true">/</span>
          Profile filter
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          {profileName} controls
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          {filtered.length} {filtered.length === 1 ? 'control' : 'controls'}{' '}
          in the {m.name} module under the {profileName} profile.
        </p>
      </header>

      <div className="pt-8">
        <ControlsTable
          controls={filtered}
          moduleSlug={m.id}
          emptyTitle={`No ${profileName} controls catalogued yet.`}
          emptyHint="The catalogue grows as new modules and profiles ship. Check back soon."
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
