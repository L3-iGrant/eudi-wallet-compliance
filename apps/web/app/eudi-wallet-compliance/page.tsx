import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from '../_components/ChevronRight';

export const metadata: Metadata = {
  title: 'EUDI Wallet Compliance · iGrant.io',
  description:
    'The EUDI Wallet Compliance namespace hosts the Self-Assessment runner and (soon) related tools for verifying EAA artefacts against ETSI, IETF, ISO, OpenID, and W3C specs.',
  alternates: { canonical: '/eudi-wallet-compliance/' },
};

export default function EudiWalletComplianceLanding() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        EUDI Wallet Compliance
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        Verify your EAA against the EUDI Wallet specification stack.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        The Self-Assessment runner exercises an Electronic Attestation of
        Attributes against the controls catalogue and produces a
        downloadable report. Free, open-source, and runs entirely in your
        browser; nothing is sent to a server.
      </p>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/eudi-wallet-compliance/self-assessment/"
          className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-700"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            Available now
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950 group-hover:underline dark:text-white">
            Run the Self-Assessment
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Pick a module, role, profile and tier; paste your EAA payload;
            get a control-by-control conformance report with a downloadable
            PDF and JSON.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 group-hover:underline dark:text-blue-400">
            Start
            <ChevronRight className="ml-1" />
          </span>
        </Link>

        <Link
          href="/modules/eaa-conformance/controls/"
          className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-700"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Reference
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950 group-hover:underline dark:text-white">
            Browse the controls catalogue
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Filter, search, and read every control extracted from the
            underlying ETSI, IETF, ISO, OpenID, and W3C specs. Each control
            has a stable URL.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-zinc-700 group-hover:underline dark:text-zinc-300">
            Open catalogue
            <ChevronRight className="ml-1" />
          </span>
        </Link>
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p>
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
          >
            Back to the Hub
          </Link>
        </p>
      </section>
    </article>
  );
}
