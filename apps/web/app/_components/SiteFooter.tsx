const REPO_URL = 'https://github.com/L3-iGrant/eudi-wallet-compliance';

function buildDate(): string {
  const raw = process.env.BUILD_DATE;
  if (raw) return raw;
  return new Date().toISOString().slice(0, 10);
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between dark:text-zinc-400">
        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 hover:underline dark:hover:text-white"
          >
            Open-source on GitHub
          </a>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span>
            Maintained by{' '}
            <a
              href="https://igrant.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-inherit no-underline hover:underline"
            >
              iGrant.io
            </a>
          </span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span>
            Anchored in EUDI Wallet specs from ETSI, IETF, ISO, OpenID, and W3C
          </span>
        </div>
        <span className="text-xs text-zinc-500">Last build: {buildDate()}</span>
      </div>
    </footer>
  );
}
