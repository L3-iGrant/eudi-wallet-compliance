import type { Metadata } from 'next';
import Link from 'next/link';
import { DOCS_PAGES } from './_pages';
import { ChevronRight } from '../../_components/ChevronRight';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'How to use the EUDI Wallet Compliance toolkit: getting started, evidence types, reading the report, methodology, FAQ, and privacy.',
  alternates: { canonical: '/eudi-wallet-compliance/docs/' },
};

export default function DocsIndex() {
  return (
    <article className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Documentation
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        Documentation
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        Everything you need to use the EUDI Wallet Compliance toolkit: how to
        run an assessment, what each evidence input means, how to read the
        verdicts, and how the controls catalogue is maintained.
      </p>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DOCS_PAGES.map((p) => (
          <Link
            key={p.slug}
            href={`/eudi-wallet-compliance/docs/${p.slug}/`}
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-700"
          >
            <h2 className="text-base font-semibold text-zinc-950 group-hover:underline dark:text-white">
              {p.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {p.summary}
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 group-hover:underline dark:text-blue-400">
              Read
              <ChevronRight className="ml-1" />
            </span>
          </Link>
        ))}
      </section>
    </article>
  );
}
