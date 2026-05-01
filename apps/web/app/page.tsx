import type { Metadata } from 'next';
import Link from 'next/link';
import { loadAllControls, loadModules } from '@iwc/controls';

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

function PlayIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l6-3.5z" />
    </svg>
  );
}

function StackIcon({ className }: { className?: string }) {
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
      <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
      <path d="M3 12l9 4.5 9-4.5" />
      <path d="M3 16.5L12 21l9-4.5" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
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
      <path d="M4 5a2 2 0 012-2h11v18H6a2 2 0 01-2-2V5z" />
      <path d="M9 7h5" />
      <path d="M9 11h5" />
    </svg>
  );
}

function ModuleIcon({ status }: { status: 'shipped' | 'in-development' | 'planned' }) {
  const colour =
    status === 'shipped'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500';
  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-md ${colour}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
      </svg>
    </div>
  );
}

export default async function Hub() {
  const [modules, allControls] = await Promise.all([
    loadModules(),
    loadAllControls(),
  ]);
  const controlCountByModule = new Map<string, number>();
  for (const c of allControls) {
    controlCountByModule.set(
      c.module,
      (controlCountByModule.get(c.module) ?? 0) + 1,
    );
  }
  // Shipped first, then alphabetical by name within each status group.
  const ordered = [...modules].sort((a, b) => {
    if (a.status === b.status) return a.name.localeCompare(b.name);
    if (a.status === 'shipped') return -1;
    if (b.status === 'shipped') return 1;
    return 0;
  });

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Dot-grid pattern, very faint, behind everything. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgb(228_228_231)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black_40%,transparent_100%)] dark:[background-image:radial-gradient(circle_at_1px_1px,rgb(63_63_70)_1px,transparent_0)]"
        />
        {/* Soft colour blobs for depth. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-[520px] w-[520px] rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-900/30"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-40 h-[400px] w-[400px] rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/20"
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 sm:py-24 lg:grid-cols-12 lg:gap-8 lg:py-28">
          {/* Left column: copy + CTAs */}
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-400">
              <span className="inline-block h-px w-6 align-middle bg-blue-700 mr-3 dark:bg-blue-400" />
              Free · Open-source · Spec-anchored
            </p>
            <h1 className="mt-5 max-w-2xl text-balance font-semibold tracking-tight text-zinc-950 dark:text-white">
              <span className="block text-5xl sm:text-6xl lg:text-7xl">
                EUDI Wallet Compliance
              </span>
              <span className="mt-5 block text-balance text-xl leading-snug text-zinc-700 sm:text-2xl lg:text-3xl dark:text-zinc-300">
                The reference toolkit for{' '}
                <span className="font-semibold text-zinc-950 dark:text-white">
                  (Q) EAA Issuers
                </span>
                ,{' '}
                <span className="font-semibold text-zinc-950 dark:text-white">
                  Wallet Providers
                </span>
                ,{' '}
                <span className="font-semibold text-zinc-950 dark:text-white">
                  QTSPs
                </span>
                , and{' '}
                <span className="font-semibold text-zinc-950 dark:text-white">
                  Relying Parties
                </span>
                .
              </span>
            </h1>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                href="/self-assessment/"
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-zinc-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Run the Self-Assessment
                <span aria-hidden="true" className="ml-2">&rarr;</span>
              </Link>
              <Link
                href="/modules/eaa-conformance/controls/"
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white/80 px-5 py-3 text-sm font-semibold text-zinc-900 backdrop-blur transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-white dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
              >
                Browse the Control Catalogue
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
              New here?{' '}
              <Link
                href="/docs/"
                className="font-medium text-zinc-700 underline-offset-4 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
              >
                Read the docs
              </Link>
              {' '}for the lay of the land.
            </p>
          </div>

          {/* Right column: spec-anchored code preview */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl border border-zinc-200 bg-white/80 shadow-xl shadow-blue-100/40 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:shadow-blue-950/40">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                </div>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  section-5.yaml
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-[12.5px] leading-6 font-mono text-zinc-700 dark:text-zinc-300">
{`- id: `}<span className="text-blue-700 dark:text-blue-400">EAA-5.2.10.1-04</span>{`
  module: `}<span className="text-emerald-700 dark:text-emerald-400">eaa-conformance</span>{`
  spec_source:
    document: `}<span className="text-zinc-500">ETSI TS 119 472-1</span>{`
    version: `}<span className="text-zinc-500">v1.2.1</span>{`
    clause: `}<span className="text-zinc-500">5.2.10.1</span>{`
  modal_verb: `}<span className="text-amber-700 dark:text-amber-400">shall</span>{`
  applies_to: [ordinary-eaa, qeaa, pub-eaa]
  spec_text: >-
    The status JSON Object shall
    have the type member.
  short_title: `}<span className="text-zinc-500">Status JSON Object must</span>{`
    `}<span className="text-zinc-500">include the type member</span>
              </pre>
              <div className="border-t border-zinc-200 px-4 py-2.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">●</span>{' '}
                Every check in the engine traces back to a YAML control entry like this.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Start where you are: task-led 3-card band */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
            Start where you are
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
            Pick the path that matches what you came to do.
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/self-assessment/"
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              aria-hidden="true"
            >
              <PlayIcon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              I want to check my EAA
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950 group-hover:underline dark:text-white">
              Run the Self-Assessment
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Drop in an EAA, pick the role and tier you are checking against,
              get a control-by-control conformance report. Runs in your
              browser. No login.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 group-hover:underline dark:text-blue-300">
              Open the runner{' '}
              <span aria-hidden="true" className="ml-1 transition group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>

          <Link
            href="/modules/eaa-conformance/controls/"
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
              aria-hidden="true"
            >
              <SearchIcon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              I want to look up a control
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950 group-hover:underline dark:text-white">
              Browse the catalogue
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Filter, search, export. Every requirement from ETSI TS 119 472-1
              has a stable URL with plain-English explanation, common
              mistakes, and related controls.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 group-hover:underline dark:text-blue-300">
              Open the catalogue{' '}
              <span aria-hidden="true" className="ml-1 transition group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>

          <Link
            href="/modules/eaa-conformance/"
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              aria-hidden="true"
            >
              <BookIcon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              I want to understand the scope
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-950 group-hover:underline dark:text-white">
              Read the EAA module page
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              See the module overview: spec sources, total control count,
              what we test mechanically, and what we add beyond ETSI.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 group-hover:underline dark:text-blue-300">
              Read the overview{' '}
              <span aria-hidden="true" className="ml-1 transition group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>
        </div>
      </section>

      {/* Frameworks covered */}
      <section className="border-t border-zinc-100 bg-zinc-50/50 py-16 sm:py-20 dark:border-zinc-900 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
              Frameworks covered
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              Seven modules across the EUDI Wallet compliance stack.
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
              Each module maps to a distinct compliance surface, from
              issuance and presentation to QTSP operations and trust lists.
              EAA Conformance is the first to ship, anchored in ETSI TS 119
              472-1. The other six are in active development across upcoming
              releases.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((m) => {
              const isShipped = m.status === 'shipped';
              const count = controlCountByModule.get(m.id) ?? 0;
              const cardBase =
                'group flex flex-col rounded-xl border bg-white p-5 transition dark:bg-zinc-950';
              const shippedBorder =
                'border-zinc-200 shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:hover:border-blue-700';
              const upcomingBorder =
                'border-dashed border-zinc-300 bg-zinc-50/40 dark:border-zinc-700 dark:bg-zinc-900/40';

              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <ModuleIcon status={m.status} />
                    <span
                      className={
                        isShipped
                          ? 'inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'inline-flex w-fit items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }
                    >
                      {isShipped ? 'Shipped' : 'In development'}
                    </span>
                  </div>
                  <h3
                    className={
                      isShipped
                        ? 'mt-4 text-base font-semibold text-zinc-950 group-hover:underline dark:text-white'
                        : 'mt-4 text-base font-semibold text-zinc-700 dark:text-zinc-300'
                    }
                  >
                    {m.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {m.short_description}
                  </p>
                  <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
                    {m.spec_sources.join(' · ')}
                  </p>
                  {isShipped && count > 0 && (
                    <p className="mt-3 flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {count} controls catalogued
                      </span>
                      <span
                        aria-hidden="true"
                        className="translate-x-0 text-blue-700 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100 dark:text-blue-400"
                      >
                        &rarr;
                      </span>
                    </p>
                  )}
                </>
              );

              return isShipped ? (
                <Link
                  key={m.id}
                  href={`/modules/${m.id}/`}
                  className={`${cardBase} ${shippedBorder}`}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={m.id}
                  className={`${cardBase} ${upcomingBorder}`}
                  aria-disabled="true"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workspace teaser (demoted from the old Two-Access-Modes section) */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 dark:border-zinc-700 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              aria-hidden="true"
            >
              <StackIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                Coming Q3 2026
              </p>
              <h3 className="mt-1 text-base font-semibold text-zinc-950 dark:text-white">
                Workspace, the multi-tenant SaaS for compliance teams
              </h3>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                Persistent assessments, custom controls, role-based
                collaboration, white-labelled reports, and integrations into
                your CI and ticketing.
              </p>
            </div>
          </div>
          <a
            href="https://igrant.io/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:border-blue-300 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-blue-700 dark:hover:text-blue-300"
          >
            Talk to iGrant.io{' '}
            <span aria-hidden="true" className="ml-1.5">&rarr;</span>
          </a>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-t border-zinc-100 bg-white py-12 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-center gap-2">
              <CheckMark />
              Anchored in ETSI, IETF, ISO, and W3C specs
            </li>
            <li className="flex items-center gap-2">
              <CheckMark />
              EAA module live on TS 119 472-1 v1.2.1
            </li>
            <li className="flex items-center gap-2">
              <CheckMark />
              <a
                href="https://signature-plugtests.etsi.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-900 hover:underline dark:hover:text-white"
              >
                Active during ETSI EAA Plugtests 2026
                <span aria-hidden="true" className="ml-1">↗</span>
              </a>
            </li>
            <li className="flex items-center gap-2">
              <CheckMark />
              No login required
            </li>
            <li className="flex items-center gap-2">
              <CheckMark />
              Apache 2.0 once public
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

function CheckMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
