import Link from 'next/link';
import { loadModules } from '@iwc/controls';
import { SearchTrigger } from './SearchTrigger';
import { ChevronRight } from './ChevronRight';
import { ModulesDropdown } from './ModulesDropdown';

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
          <Link href="/eudi-wallet-compliance/self-assessment/" className={linkClass}>
            Self-Assessment
          </Link>

          <ModulesDropdown modules={modules} linkClass={linkClass} />

          <Link href="/modules/eaa-conformance/controls/" className={linkClass}>
            Control Catalogue
          </Link>

          <Link href="/eudi-wallet-compliance/reference-samples/" className={linkClass}>
            Reference Samples
          </Link>

          <Link href="/eudi-wallet-compliance/docs/" className={linkClass}>
            Docs
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <SearchTrigger />
          <Link
            href="/eudi-wallet-compliance/self-assessment/"
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
