import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Self-Assessment · EUDI Wallet Compliance · iGrant.io',
  description:
    'The Self-Assessment runner is in active development. Browse the controls catalogue today and run a check on your EAA when the runner ships.',
  alternates: { canonical: '/self-assessment/' },
  openGraph: {
    title: 'Self-Assessment · EUDI Wallet Compliance',
    description:
      'A browser-based EAA conformance runner, free and open-source. Coming soon.',
    type: 'website',
    url: '/self-assessment/',
  },
};

export default function SelfAssessmentComingSoon() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Self-Assessment · Coming soon
      </p>
      <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl dark:text-white">
        The Self-Assessment runner is on its way.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-700 sm:text-lg dark:text-zinc-300">
        We are wiring up the assessment runner: pick a module, role, and
        tier; drop in your EAA; get a control-by-control conformance report.
        It runs in your browser, no login. Until then, the controls catalogue
        is fully browseable.
      </p>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/modules/eaa-conformance/controls/"
          className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-700"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Available now
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950 group-hover:underline dark:text-white">
            Browse the controls catalogue
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Filter, search, and read every control in plain English. Each
            control has a stable URL you can reference from your tracker.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 group-hover:underline dark:text-blue-400">
            Open the catalogue <span aria-hidden="true" className="ml-1">&gt;</span>
          </span>
        </Link>

        <a
          href="https://igrant.io/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Want it sooner?
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950 group-hover:underline dark:text-white">
            Pilot the runner with iGrant.io
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            We are running the assessment against partner EAAs ahead of the
            public launch. If you want to be part of that, get in touch.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-zinc-700 group-hover:underline dark:text-zinc-300">
            Talk to iGrant.io <span aria-hidden="true" className="ml-1">&gt;</span>
          </span>
        </a>
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p>
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
          >
            <span aria-hidden="true" className="mr-1">&larr;</span>
            Back to the Hub
          </Link>
        </p>
      </section>
    </article>
  );
}
