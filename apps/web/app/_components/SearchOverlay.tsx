'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { getSearchProvider, type SearchHit } from '@/lib/search';

/**
 * Custom event name used by SearchTrigger to ask the overlay to open.
 * Plain DOM events keep the two components decoupled with no shared
 * React state.
 */
export const OPEN_SEARCH_EVENT = 'iwc:open-search';

interface FilterOption {
  id: string;
  label: string;
  filters?: Record<string, string[]>;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'ordinary', label: 'Ordinary EAA', filters: { applies_to: ['ordinary-eaa'] } },
  { id: 'qeaa', label: 'QEAA', filters: { applies_to: ['qeaa'] } },
  { id: 'pub-eaa', label: 'PuB-EAA', filters: { applies_to: ['pub-eaa'] } },
];

const MODULE_LABEL: Record<string, string> = {
  'eaa-conformance': 'EAA Conformance',
};

function clauseSectionLabel(controlId: string | undefined): string {
  // Group by top-level clause: EAA-5.2.10.1-04 → "Clause 5.2", QEAA-5.6.2-01 → "Clause 5.6"
  if (!controlId) return 'Other';
  const m = controlId.match(/-(\d+\.\d+)/);
  return m ? `Clause ${m[1]}` : 'Other';
}

interface GroupedResults {
  groupKey: string;
  groupLabel: string;
  hits: SearchHit[];
}

function groupByClauseSection(hits: SearchHit[]): GroupedResults[] {
  const groups = new Map<string, SearchHit[]>();
  for (const h of hits) {
    const key = clauseSectionLabel(h.meta.control_id);
    const list = groups.get(key) ?? [];
    list.push(h);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => ({
      groupKey: key,
      groupLabel: key,
      hits: list,
    }));
}

export function SearchOverlay() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    // Reset on close so reopening starts fresh.
    setQuery('');
    setHits([]);
    setActiveFilter('all');
    setActiveIndex(-1);
    setErrored(false);
  }, []);

  // Listen for trigger events and Cmd/Ctrl+K shortcut.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Avoid SSR markup mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Focus input when opened, lock body scroll.
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Debounced search.
  const filterOption = useMemo(
    () => FILTER_OPTIONS.find((f) => f.id === activeFilter) ?? FILTER_OPTIONS[0]!,
    [activeFilter],
  );

  useEffect(() => {
    if (!open) return undefined;
    if (!query.trim()) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setHits([]);
      setErrored(false);
      setActiveIndex(-1);
      /* eslint-enable react-hooks/set-state-in-effect */
      return undefined;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setErrored(false);
      try {
        const provider = getSearchProvider();
        const result = await provider.search(query, {
          limit: 20,
          filters: filterOption.filters,
        });
        setHits(result);
        setActiveIndex(result.length > 0 ? 0 : -1);
      } catch {
        setErrored(true);
        setHits([]);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [open, query, filterOption]);

  const grouped = useMemo(() => groupByClauseSection(hits), [hits]);
  const flatHits = useMemo(() => grouped.flatMap((g) => g.hits), [grouped]);

  // Up/down/enter keyboard navigation.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) =>
          flatHits.length === 0 ? -1 : Math.min(flatHits.length - 1, i + 1),
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (flatHits.length === 0 ? -1 : Math.max(0, i - 1)));
      } else if (e.key === 'Enter') {
        const target = flatHits[activeIndex];
        if (target) {
          e.preventDefault();
          router.push(target.url);
          close();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, flatHits, activeIndex, router, close]);

  // Scroll the active item into view.
  useEffect(() => {
    if (activeIndex < 0 || !resultsRef.current) return;
    const el = resultsRef.current.querySelector<HTMLElement>(
      `[data-hit-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!mounted) return null;

  // Stays mounted so the close transition can play. `open` drives the
  // translate + opacity classes; pointer-events-none on the wrapper lets
  // the rest of the page receive clicks while the panel is parked
  // off-screen on the right.
  return (
    <div
      role="dialog"
      aria-modal={open}
      aria-label="Search EUDI Wallet Compliance"
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex justify-end ${open ? '' : 'pointer-events-none'}`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close search"
        onClick={close}
        className={`absolute inset-0 cursor-default bg-zinc-950/30 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        tabIndex={-1}
      />

      {/* Right panel */}
      <aside
        className={`relative flex h-full w-full max-w-[480px] transform flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
            Search EUDI Wallet Compliance
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        {/* Input */}
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type and enter to search"
              className="w-full rounded-md border border-zinc-300 bg-white py-2.5 pl-10 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.id;
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => setActiveFilter(opt.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                        : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto px-2 py-2">
          {loading && (
            <p className="px-3 py-3 text-sm text-zinc-500 dark:text-zinc-500">
              Searching...
            </p>
          )}
          {!loading && errored && (
            <p className="px-3 py-3 text-sm text-zinc-500 dark:text-zinc-500">
              Search index is not available in this environment. Run{' '}
              <code className="font-mono text-xs">pnpm --filter @iwc/web build</code>{' '}
              and serve the static build to use search.
            </p>
          )}
          {!loading && !errored && !query.trim() && (
            <p className="px-3 py-3 text-xs text-zinc-500 dark:text-zinc-500">
              Type to search across every control in the catalogue. Use the
              filter chips above to narrow by tier.
            </p>
          )}
          {!loading && !errored && query.trim() && hits.length === 0 && (
            <p className="px-3 py-3 text-sm text-zinc-500 dark:text-zinc-500">
              No matches for &ldquo;{query}&rdquo; with the active filter.
            </p>
          )}
          {!loading && hits.length > 0 && (
            <ul className="space-y-3 pb-2">
              {grouped.map((g) => (
                <li key={g.groupKey}>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                    {g.groupLabel}
                  </p>
                  <ul className="space-y-0.5">
                    {g.hits.map((h) => {
                      const flatIndex = flatHits.indexOf(h);
                      const isActive = flatIndex === activeIndex;
                      const moduleLabel = h.meta.module
                        ? MODULE_LABEL[h.meta.module] ?? h.meta.module
                        : undefined;
                      return (
                        <li key={h.id}>
                          <a
                            href={h.url}
                            data-hit-index={flatIndex}
                            onClick={(e) => {
                              e.preventDefault();
                              router.push(h.url);
                              close();
                            }}
                            onMouseEnter={() => setActiveIndex(flatIndex)}
                            className={`flex flex-col gap-0.5 rounded-md px-3 py-2 transition ${
                              isActive
                                ? 'bg-zinc-900 text-white dark:bg-blue-900/40 dark:text-white'
                                : 'text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900'
                            }`}
                          >
                            <span className="flex items-center justify-between gap-2">
                              <span
                                className={`font-mono text-[11px] font-semibold ${
                                  isActive
                                    ? 'text-blue-200 dark:text-blue-300'
                                    : 'text-blue-700 dark:text-blue-400'
                                }`}
                              >
                                {h.meta.control_id ?? ''}
                              </span>
                              {moduleLabel && (
                                <span
                                  className={`text-[10px] uppercase tracking-wider ${
                                    isActive
                                      ? 'text-zinc-300 dark:text-zinc-300'
                                      : 'text-zinc-500 dark:text-zinc-500'
                                  }`}
                                >
                                  {moduleLabel}
                                </span>
                              )}
                            </span>
                            <span className="text-sm font-medium">
                              {h.title}
                            </span>
                            {h.excerpt && (
                              <span
                                className={`line-clamp-2 text-xs leading-relaxed [&_mark]:rounded [&_mark]:px-0.5 ${
                                  isActive
                                    ? 'text-zinc-200 [&_mark]:bg-amber-500/30 [&_mark]:text-white'
                                    : 'text-zinc-600 [&_mark]:bg-amber-100 [&_mark]:text-zinc-900 dark:text-zinc-400 dark:[&_mark]:bg-amber-900/40 dark:[&_mark]:text-zinc-100'
                                }`}
                                dangerouslySetInnerHTML={{ __html: h.excerpt }}
                              />
                            )}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <footer className="flex items-center justify-end gap-4 border-t border-zinc-200 px-5 py-2.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <KbdKey>↵</KbdKey> to select
          </span>
          <span className="flex items-center gap-1">
            <KbdKey>↑</KbdKey>
            <KbdKey>↓</KbdKey> to navigate
          </span>
          <span className="flex items-center gap-1">
            <KbdKey>Esc</KbdKey> to close
          </span>
        </footer>
      </aside>
    </div>
  );
}

function KbdKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-[1.1rem] items-center justify-center rounded border border-zinc-200 bg-zinc-50 px-1 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
      {children}
    </kbd>
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
