import type { Metadata } from 'next';
import Link from 'next/link';
import { loadModules } from '@iwc/controls';

export const metadata: Metadata = {
  title: 'EUDI Wallet Compliance · iGrant.io',
  description:
    'The reference conformance toolkit for EUDI Wallet infrastructure providers. Free, open-source, spec-anchored. Maintained by iGrant.io.',
  keywords: [
    'EUDI Wallet compliance',
    'EUDI Wallet self-assessment',
    'EUDIW conformance',
    'EAA conformance',
    'QEAA',
  ],
  openGraph: {
    title: 'EUDI Wallet Compliance · iGrant.io',
    description:
      'Free, open-source toolkit to verify your EUDI Wallet stack against the relevant ETSI, ISO, IETF, and W3C standards before notified-body assessment.',
    type: 'website',
    siteName: 'EUDI Wallet Compliance',
  },
};

export default async function Hub() {
  const modules = await loadModules();
  const shipped = modules.filter((m) => m.status === 'shipped');
  const upcoming = modules.filter((m) => m.status !== 'shipped');

  return (
    <>
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-16 sm:py-24 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl md:text-5xl dark:text-white">
            EUDI Wallet Compliance - The reference toolkit for (Q) EAA
            Issuers, Wallet Providers, QTSPs, and Relying Parties.
          </h1>
          <p className="mt-6 text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
            Built and maintained by iGrant.io.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/self-assessment/"
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:outline-white"
            >
              Run the Self-Assessment
            </Link>
            <Link
              href="/modules/eaa-conformance/controls/"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
            >
              Browse the Control Catalogue
            </Link>
            <Link
              href="/docs/"
              className="inline-flex items-center justify-center px-3 py-3 text-sm font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* Two-tier picker */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Two ways to use this
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/self-assessment/"
            className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              Available now
            </span>
            <h3 className="mt-3 text-xl font-semibold text-zinc-950 group-hover:underline dark:text-white">
              Self-Assessment
            </h3>
            <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              Free, public, no login. Upload an EAA, pick the role and tier you
              are checking against, get a control-by-control conformance
              report. Runs entirely in your browser session.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-zinc-900 dark:text-white">
              Open the tool <span aria-hidden="true" className="ml-1">&rarr;</span>
            </span>
          </Link>

          <div
            className="flex flex-col rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900/40"
            aria-disabled="true"
          >
            <span className="inline-flex w-fit items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Coming Q3 2026
            </span>
            <h3 className="mt-3 text-xl font-semibold text-zinc-700 dark:text-zinc-300">
              Workspace
            </h3>
            <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              Multi-tenant SaaS for compliance teams: persistent assessments,
              custom controls, role-based collaboration, white-labelled
              reports, and integrations into your CI and ticketing.
            </p>
            <span className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-500">
              Notify me when this launches
            </span>
          </div>
        </div>
      </section>

      {/* Framework picker */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Frameworks covered
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          The EAA Conformance module ships today, covering ETSI TS 119 472-1.
          The remaining modules sit alongside it in the build pipeline and
          will surface as they reach review.
        </p>

        {shipped.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shipped.map((m) => (
              <Link
                key={m.id}
                href={`/modules/${m.id}/`}
                className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Shipped
                </span>
                <h3 className="mt-3 text-base font-semibold text-zinc-950 group-hover:underline dark:text-white">
                  {m.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {m.short_description}
                </p>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  {m.spec_sources.join(' · ')}
                </p>
              </Link>
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => (
              <div
                key={m.id}
                className="flex flex-col rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900/40"
                aria-disabled="true"
              >
                <span className="inline-flex w-fit items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  In development
                </span>
                <h3 className="mt-3 text-base font-semibold text-zinc-700 dark:text-zinc-300">
                  {m.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {m.short_description}
                </p>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  {m.spec_sources.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Brief explainer */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-base text-zinc-700 dark:text-zinc-300">
            Free, open-source, spec-anchored. Used to verify your EUDI Wallet
            stack against the relevant ETSI, ISO, IETF, and W3C standards
            before notified-body assessment.
          </p>
        </div>
      </section>

      {/* Trust signals */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Built on TS 119 472-1 v1.2.1</li>
          <li aria-hidden="true">·</li>
          <li>References ETSI</li>
          <li aria-hidden="true">·</li>
          <li>
            <a
              href="https://github.com/L3-iGrant/eudi-wallet-compliance"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 hover:underline dark:hover:text-white"
            >
              Open-source on GitHub
            </a>
          </li>
          <li aria-hidden="true">·</li>
          <li>No login required</li>
        </ul>
      </section>
    </>
  );
}
