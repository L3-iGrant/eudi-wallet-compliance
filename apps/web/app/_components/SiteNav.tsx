import Link from 'next/link';
import { loadModules } from '@iwc/controls';
import { SearchTrigger } from './SearchTrigger';
import { ChevronRight } from './ChevronRight';

const linkClass =
  'inline-flex items-center px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white';

export async function SiteNav() {
  const modules = await loadModules();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <nav aria-label="Primary" className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
        <Link
          href="/"
          className="mr-4 flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-950 hover:text-zinc-700 dark:text-white dark:hover:text-zinc-200"
        >
          EUDI Wallet Compliance
        </Link>

        <div className="hidden flex-1 items-center gap-1 md:flex">
          <Link href="/self-assessment/" className={linkClass}>
            Self-Assessment
          </Link>

          {/* CSS-only dropdown via :focus-within. No client JS in this nav. */}
          <div className="group relative">
            <button
              type="button"
              className={linkClass}
              aria-haspopup="menu"
              aria-expanded="false"
            >
              Modules
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="ml-1 h-4 w-4 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <ul
              role="menu"
              className="invisible absolute left-0 top-full z-50 mt-1 w-72 rounded-md border border-zinc-200 bg-white py-1 opacity-0 shadow-lg transition focus-within:visible focus-within:opacity-100 group-hover:visible group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {modules.map((m) => (
                <li key={m.id} role="none">
                  {m.status === 'shipped' ? (
                    <Link
                      href={`/modules/${m.id}/`}
                      role="menuitem"
                      className="flex flex-col px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                      <span>{m.name}</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        Shipped
                      </span>
                    </Link>
                  ) : (
                    <span
                      role="menuitem"
                      aria-disabled="true"
                      className="flex cursor-not-allowed flex-col px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500"
                    >
                      <span>{m.name}</span>
                      <span className="text-xs">Coming soon</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <Link href="/modules/eaa-conformance/controls/" className={linkClass}>
            Control Catalogue
          </Link>

          <span
            className={`${linkClass} cursor-not-allowed opacity-60`}
            aria-disabled="true"
            title="Coming soon"
          >
            Reference Samples
          </span>

          <Link href="/docs/" className={linkClass}>
            Docs
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <SearchTrigger />
          <Link
            href="/self-assessment/"
            className="inline-flex items-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:outline-white"
          >
            Run Assessment{' '}
            <ChevronRight className="ml-1" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
