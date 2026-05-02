import type { Metadata } from 'next';
import Link from 'next/link';
import { loadAllControlsSync, loadModulesSync } from '@iwc/controls/sync';
import { ChevronRight } from '../_components/ChevronRight';

export const metadata: Metadata = {
  title: 'Modules',
  description:
    'Browse every EUDI Wallet Compliance module: EAA Conformance, PID/LPID, Wallet Attestation, OpenID4VCI, OpenID4VP, QTSP, Trust List.',
  alternates: { canonical: '/modules/' },
};

export default function ModulesIndex() {
  const modules = loadModulesSync();
  const controls = loadAllControlsSync();
  const controlCountByModule = new Map<string, number>();
  for (const c of controls) {
    controlCountByModule.set(
      c.module,
      (controlCountByModule.get(c.module) ?? 0) + 1,
    );
  }

  const ordered = [...modules].sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    if (a.status === 'shipped') return -1;
    if (b.status === 'shipped') return 1;
    return 0;
  });

  return (
    <article className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Modules
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        Seven modules across the EUDI Wallet compliance stack
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        Each module bundles the controls catalogue, samples, and engine
        checks for a specific spec area. EAA Conformance is live; the
        others are in the build pipeline.
      </p>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ordered.map((m) => {
          const isShipped = m.status === 'shipped';
          const count = controlCountByModule.get(m.id) ?? 0;
          return (
            <Link
              key={m.id}
              href={`/modules/${m.id}/`}
              className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-700"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-950 group-hover:underline dark:text-white">
                  {m.name}
                </h2>
                {isShipped ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <span
                      aria-hidden="true"
                      className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                    />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    In development
                  </span>
                )}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {m.short_description}
              </p>
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                {m.spec_sources.join(' · ')}
              </p>
              {isShipped && count > 0 && (
                <p className="mt-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {count} controls catalogued
                  </span>
                  <span className="inline-flex items-center text-blue-700 dark:text-blue-400">
                    Open
                    <ChevronRight className="ml-1" />
                  </span>
                </p>
              )}
            </Link>
          );
        })}
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p>
          <Link
            href="/eudi-wallet-compliance/"
            className="text-sm font-semibold text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
          >
            Back to EUDI Wallet Compliance
          </Link>
        </p>
      </section>
    </article>
  );
}
