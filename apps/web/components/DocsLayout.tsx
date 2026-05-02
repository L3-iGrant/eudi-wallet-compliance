import Link from 'next/link';
import { DOCS_PAGES } from '@/app/eudi-wallet-compliance/docs/_pages';
import { ChevronRight } from '@/app/_components/ChevronRight';

interface DocsLayoutProps {
  currentSlug?: string;
  title: string;
  /** ISO date the doc was last reviewed; rendered in the page footer. */
  lastReviewed: string;
  children: React.ReactNode;
}

export function DocsLayout({
  currentSlug,
  title,
  lastReviewed,
  children,
}: DocsLayoutProps) {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[14rem_1fr] lg:py-16">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
          Documentation
        </p>
        <nav className="mt-3 flex flex-col gap-1 text-sm">
          <Link
            href="/eudi-wallet-compliance/docs/"
            className={
              currentSlug === undefined
                ? 'rounded-md bg-blue-50 px-3 py-2 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                : 'rounded-md px-3 py-2 text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white'
            }
          >
            Overview
          </Link>
          {DOCS_PAGES.map((p) => {
            const isActive = currentSlug === p.slug;
            return (
              <Link
                key={p.slug}
                href={`/eudi-wallet-compliance/docs/${p.slug}/`}
                className={
                  isActive
                    ? 'rounded-md bg-blue-50 px-3 py-2 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'rounded-md px-3 py-2 text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white'
                }
              >
                {p.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-balance prose-h1:text-3xl sm:prose-h1:text-4xl prose-h2:mt-12 prose-h2:text-xl sm:prose-h2:text-2xl prose-h3:mt-8 prose-h3:text-lg prose-a:text-blue-700 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-blue-400 prose-code:rounded prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-px prose-code:font-mono prose-code:text-[0.875em] prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-zinc-800">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          Documentation
        </p>
        <h1 className="mt-3">{title}</h1>
        {children}
        <hr className="my-12 border-zinc-200 dark:border-zinc-800" />
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Last reviewed {new Date(lastReviewed).toLocaleDateString('en-GB')}.{' '}
          <Link href="/eudi-wallet-compliance/docs/">All documentation</Link>
          {' · '}
          <Link href="/">Back to the Hub</Link>
          {' · '}
          <ChevronRight className="ml-0 inline-block translate-y-0.5" />
        </p>
      </article>
    </div>
  );
}
