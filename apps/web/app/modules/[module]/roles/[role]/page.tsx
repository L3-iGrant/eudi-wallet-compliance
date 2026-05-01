import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadAllControls, loadModules, type Role } from '@iwc/controls';
import { ControlsTable, ROLE_LABEL } from '../../_components/ControlsTable';
import { ChevronRight } from '../../../../_components/ChevronRight';

const ROLES = ['issuer', 'verifier', 'wallet', 'rp', 'qtsp', 'all'] as const;
type RoleSlug = (typeof ROLES)[number];

function isRoleSlug(s: string): s is RoleSlug {
  return (ROLES as readonly string[]).includes(s);
}

interface PageProps {
  params: Promise<{ module: string; role: string }>;
}

export async function generateStaticParams() {
  const modules = await loadModules();
  const shipped = modules.filter((m) => m.status === 'shipped');
  return shipped.flatMap((m) =>
    ROLES.map((r) => ({ module: m.id, role: r })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { module: moduleSlug, role } = await params;
  if (!isRoleSlug(role)) return {};
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleSlug);
  if (!m) return {};
  const controls = await loadAllControls();
  const filtered = controls.filter(
    (c) => c.module === moduleSlug && c.role.includes(role as Role),
  );
  const url = `/modules/${moduleSlug}/roles/${role}/`;
  const roleName = ROLE_LABEL[role];
  return {
    title: `${roleName} controls · ${m.name} · iGrant.io`,
    description: `${filtered.length} ${roleName} control${filtered.length === 1 ? '' : 's'} in the ${m.name} module.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${roleName} controls · ${m.name}`,
      description: `${filtered.length} controls in the ${m.name} module that the ${roleName} role is responsible for.`,
      type: 'website',
      url,
    },
  };
}

export default async function RoleFilteredPage({ params }: PageProps) {
  const { module: moduleSlug, role } = await params;
  if (!isRoleSlug(role)) notFound();
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleSlug);
  if (!m) notFound();
  const controls = await loadAllControls();
  const filtered = controls.filter(
    (c) => c.module === moduleSlug && c.role.includes(role as Role),
  );
  const roleName = ROLE_LABEL[role];

  return (
    <article className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          <Link href={`/modules/${m.id}/`} className="hover:underline">
            {m.name}
          </Link>
          <span className="mx-2 text-zinc-400" aria-hidden="true">/</span>
          Role filter
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          {roleName} controls
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          {filtered.length} {filtered.length === 1 ? 'control' : 'controls'}{' '}
          in the {m.name} module that the {roleName} role is responsible
          for.
        </p>
      </header>

      <div className="pt-8">
        <ControlsTable
          controls={filtered}
          moduleSlug={m.id}
          emptyTitle={`No ${roleName} controls catalogued yet.`}
          emptyHint="The catalogue grows as new roles are exercised. Check back soon."
        />
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800">
        <Link
          href={`/modules/${m.id}/controls/`}
          className="font-semibold text-blue-700 hover:underline dark:text-blue-400"
        >
          Open the full controls catalogue
          <ChevronRight className="ml-1" />
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
