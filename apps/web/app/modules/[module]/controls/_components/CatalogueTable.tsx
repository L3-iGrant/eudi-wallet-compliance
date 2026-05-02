'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface CatalogueRow {
  id: string;
  slug: string;
  short_title: string;
  requirement_level: 'shall' | 'should' | 'may';
  applies_to: string[];
  profile: string[];
  role: string[];
  evidence_type: string[];
  clause: string;
  /** True when @iwc/engine has a registered automated check for this control. */
  auto_tested: boolean;
}

interface FilterOption {
  value: string;
  label: string;
}

const PROFILE_OPTIONS: FilterOption[] = [
  { value: 'sd-jwt-vc', label: 'SD-JWT VC' },
  { value: 'mdoc', label: 'mdoc' },
  { value: 'abstract', label: 'Abstract' },
];

const ROLE_OPTIONS: FilterOption[] = [
  { value: 'issuer', label: 'Issuer' },
  { value: 'verifier', label: 'Verifier' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'rp', label: 'Relying Party' },
  { value: 'qtsp', label: 'QTSP' },
  { value: 'all', label: 'All' },
];

const TIER_OPTIONS: FilterOption[] = [
  { value: 'ordinary-eaa', label: 'Ordinary EAA' },
  { value: 'qeaa', label: 'QEAA' },
  { value: 'pub-eaa', label: 'PuB-EAA' },
  { value: 'all', label: 'All' },
];

const MODAL_OPTIONS: FilterOption[] = [
  { value: 'shall', label: 'shall' },
  { value: 'should', label: 'should' },
  { value: 'may', label: 'may' },
];

const APPLIES_TO_LABEL: Record<string, string> = Object.fromEntries(
  TIER_OPTIONS.map((o) => [o.value, o.label]),
);

const PROFILE_LABEL: Record<string, string> = Object.fromEntries(
  PROFILE_OPTIONS.map((o) => [o.value, o.label]),
);

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((o) => [o.value, o.label]),
);

const EVIDENCE_LABEL: Record<string, string> = {
  'eaa-payload': 'EAA payload',
  'eaa-header': 'EAA header',
  'issuer-cert': 'Issuer cert',
  'status-list': 'Status list',
  'type-metadata': 'Type metadata',
  'trust-list': 'Trust list',
};

const MODAL_STYLES = {
  shall: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  should:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  may: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
} as const;

interface FiltersState {
  profiles: string[];
  roles: string[];
  tiers: string[];
  levels: string[];
  text: string;
  /** When true, hide rows that don't have an automated check yet. */
  autoTestedOnly: boolean;
}

const EMPTY_FILTERS: FiltersState = {
  profiles: [],
  roles: [],
  tiers: [],
  levels: [],
  text: '',
  autoTestedOnly: false,
};

function readFilters(params: URLSearchParams): FiltersState {
  const csv = (key: string): string[] => {
    const v = params.get(key);
    return v ? v.split(',').filter(Boolean) : [];
  };
  return {
    profiles: csv('profile'),
    roles: csv('role'),
    tiers: csv('tier'),
    levels: csv('level'),
    text: params.get('q') ?? '',
    autoTestedOnly: params.get('autoTested') === '1',
  };
}

function buildSearchString(filters: FiltersState): string {
  const params = new URLSearchParams();
  if (filters.profiles.length) params.set('profile', filters.profiles.join(','));
  if (filters.roles.length) params.set('role', filters.roles.join(','));
  if (filters.tiers.length) params.set('tier', filters.tiers.join(','));
  if (filters.levels.length) params.set('level', filters.levels.join(','));
  if (filters.text) params.set('q', filters.text);
  if (filters.autoTestedOnly) params.set('autoTested', '1');
  return params.toString();
}

type SortKey = 'id' | 'clause' | 'requirement_level';
type SortDir = 'asc' | 'desc';
const LEVEL_RANK: Record<string, number> = { shall: 0, should: 1, may: 2 };

function compareRows(a: CatalogueRow, b: CatalogueRow, key: SortKey): number {
  if (key === 'requirement_level') {
    return (
      (LEVEL_RANK[a.requirement_level] ?? 99) -
      (LEVEL_RANK[b.requirement_level] ?? 99)
    );
  }
  return a[key].localeCompare(b[key]);
}

function clauseSortKey(c: string): string {
  // "5.2.10.1" → "00005.00002.00010.00001" so string compare matches numeric.
  return c
    .split('.')
    .map((n) => n.padStart(5, '0'))
    .join('.');
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(next);
  };

  const summary = selected.length === 0 ? label : `${label} · ${selected.length}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition ${
          selected.length > 0
            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
            : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600'
        }`}
      >
        {summary}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[12rem] rounded-md border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {options.map((o) => {
            const checked = selected.includes(o.value);
            return (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(o.value)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-900"
                />
                {o.label}
              </label>
            );
          })}
          {selected.length > 0 && (
            <div className="mt-1 border-t border-zinc-200 pt-1 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Clear {label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: CatalogueRow[]): string {
  const headers = [
    'id',
    'short_title',
    'requirement_level',
    'clause',
    'applies_to',
    'profile',
    'role',
    'evidence_type',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const cells = [
      r.id,
      r.short_title,
      r.requirement_level,
      r.clause,
      r.applies_to.join(';'),
      r.profile.join(';'),
      r.role.join(';'),
      r.evidence_type.join(';'),
    ].map((c) => csvEscape(String(c)));
    lines.push(cells.join(','));
  }
  return lines.join('\n');
}

function yamlEscape(s: string): string {
  if (
    /^[A-Za-z0-9_./-]+$/.test(s) &&
    !['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(s.toLowerCase()) &&
    !/^\d/.test(s)
  ) {
    return s;
  }
  return JSON.stringify(s);
}

function toYaml(rows: CatalogueRow[]): string {
  return rows
    .map((r) => {
      const lines: string[] = [];
      lines.push(`- id: ${yamlEscape(r.id)}`);
      lines.push(`  short_title: ${yamlEscape(r.short_title)}`);
      lines.push(`  requirement_level: ${yamlEscape(r.requirement_level)}`);
      lines.push(`  clause: ${yamlEscape(r.clause)}`);
      const arrFields: Array<keyof CatalogueRow> = [
        'applies_to',
        'profile',
        'role',
        'evidence_type',
      ];
      for (const f of arrFields) {
        const arr = r[f] as string[];
        lines.push(`  ${f}: [${arr.map(yamlEscape).join(', ')}]`);
      }
      return lines.join('\n');
    })
    .join('\n');
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so the browser can finish the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface ChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="rounded-full text-blue-700 hover:bg-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:text-blue-200 dark:hover:bg-blue-800/40"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M3.97 3.97a.75.75 0 011.06 0L8 6.94l2.97-2.97a.75.75 0 111.06 1.06L9.06 8l2.97 2.97a.75.75 0 11-1.06 1.06L8 9.06l-2.97 2.97a.75.75 0 01-1.06-1.06L6.94 8 3.97 5.03a.75.75 0 010-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </span>
  );
}

export function CatalogueTable({
  rows,
  moduleSlug,
  totalLabel,
}: {
  rows: CatalogueRow[];
  moduleSlug: string;
  totalLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [debouncedText, setDebouncedText] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate filters from URL on mount and whenever search params change.
  // Synchronising local state with an external system (the URL) is the
  // intended use of setState-in-effect here; the rule is overcautious.
  useEffect(() => {
    const next = readFilters(
      new URLSearchParams(searchParams?.toString() ?? ''),
    );
    /* eslint-disable react-hooks/set-state-in-effect */
    setFilters(next);
    setDebouncedText(next.text);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  // Debounce text changes by 200 ms.
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => setDebouncedText(filters.text), 200);
    return () => clearTimeout(t);
  }, [filters.text, hydrated]);

  // Push filter state to URL when filters change (with debounced text).
  useEffect(() => {
    if (!hydrated) return;
    const target = buildSearchString({ ...filters, text: debouncedText });
    const current = searchParams?.toString() ?? '';
    if (target === current) return;
    const next = target ? `${pathname}?${target}` : pathname;
    router.replace(next, { scroll: false });
  }, [
    filters.profiles,
    filters.roles,
    filters.tiers,
    filters.levels,
    debouncedText,
    hydrated,
    pathname,
    router,
    searchParams,
    filters,
  ]);

  const filtered = useMemo(() => {
    const text = debouncedText.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        filters.profiles.length > 0 &&
        !r.profile.some((p) => filters.profiles.includes(p))
      )
        return false;
      if (
        filters.roles.length > 0 &&
        !r.role.some((p) => filters.roles.includes(p))
      )
        return false;
      if (
        filters.tiers.length > 0 &&
        !r.applies_to.some((p) => filters.tiers.includes(p))
      )
        return false;
      if (
        filters.levels.length > 0 &&
        !filters.levels.includes(r.requirement_level)
      )
        return false;
      if (filters.autoTestedOnly && !r.auto_tested) return false;
      if (text) {
        const haystack = `${r.id} ${r.short_title}`.toLowerCase();
        if (!haystack.includes(text)) return false;
      }
      return true;
    });
  }, [
    rows,
    filters.profiles,
    filters.roles,
    filters.tiers,
    filters.levels,
    filters.autoTestedOnly,
    debouncedText,
  ]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    out.sort((a, b) => {
      const av = sortBy === 'clause' ? clauseSortKey(a.clause) : undefined;
      const bv = sortBy === 'clause' ? clauseSortKey(b.clause) : undefined;
      let cmp: number;
      if (sortBy === 'clause' && av !== undefined && bv !== undefined) {
        cmp = av.localeCompare(bv);
      } else {
        cmp = compareRows(a, b, sortBy);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [filtered, sortBy, sortDir]);

  const onHeaderClick = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const update = useCallback(<K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setDebouncedText('');
  };

  const handleExport = (kind: 'csv' | 'json' | 'yaml') => {
    const stamp = new Date().toISOString().slice(0, 10);
    const base = `${moduleSlug}-controls-${stamp}`;
    if (kind === 'csv') {
      download(`${base}.csv`, toCsv(sorted), 'text/csv;charset=utf-8');
    } else if (kind === 'json') {
      download(`${base}.json`, JSON.stringify(sorted, null, 2), 'application/json');
    } else {
      download(`${base}.yaml`, toYaml(sorted), 'application/yaml;charset=utf-8');
    }
  };

  const activeChips: Array<{ key: string; label: string; remove: () => void }> = [];
  for (const v of filters.profiles) {
    activeChips.push({
      key: `profile:${v}`,
      label: `Profile: ${PROFILE_LABEL[v] ?? v}`,
      remove: () =>
        update(
          'profiles',
          filters.profiles.filter((x) => x !== v),
        ),
    });
  }
  for (const v of filters.roles) {
    activeChips.push({
      key: `role:${v}`,
      label: `Role: ${ROLE_LABEL[v] ?? v}`,
      remove: () =>
        update(
          'roles',
          filters.roles.filter((x) => x !== v),
        ),
    });
  }
  for (const v of filters.tiers) {
    activeChips.push({
      key: `tier:${v}`,
      label: `Tier: ${APPLIES_TO_LABEL[v] ?? v}`,
      remove: () =>
        update(
          'tiers',
          filters.tiers.filter((x) => x !== v),
        ),
    });
  }
  for (const v of filters.levels) {
    activeChips.push({
      key: `level:${v}`,
      label: `Level: ${v}`,
      remove: () =>
        update(
          'levels',
          filters.levels.filter((x) => x !== v),
        ),
    });
  }
  if (filters.autoTestedOnly) {
    activeChips.push({
      key: 'autoTested',
      label: 'Auto-tested only',
      remove: () => update('autoTestedOnly', false),
    });
  }
  if (debouncedText) {
    activeChips.push({
      key: 'text',
      label: `Search: ${debouncedText}`,
      remove: () => {
        update('text', '');
        setDebouncedText('');
      },
    });
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={filters.text}
          onChange={(e) => update('text', e.target.value)}
          placeholder="Search ID or title..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 sm:w-64 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
        />
        <MultiSelect
          label="Profile"
          options={PROFILE_OPTIONS}
          selected={filters.profiles}
          onChange={(v) => update('profiles', v)}
        />
        <MultiSelect
          label="Role"
          options={ROLE_OPTIONS}
          selected={filters.roles}
          onChange={(v) => update('roles', v)}
        />
        <MultiSelect
          label="Tier"
          options={TIER_OPTIONS}
          selected={filters.tiers}
          onChange={(v) => update('tiers', v)}
        />
        <MultiSelect
          label="Level"
          options={MODAL_OPTIONS}
          selected={filters.levels}
          onChange={(v) => update('levels', v)}
        />
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
            filters.autoTestedOnly
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600'
          }`}
        >
          <input
            type="checkbox"
            checked={filters.autoTestedOnly}
            onChange={(e) => update('autoTestedOnly', e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600 dark:border-zinc-700 dark:bg-zinc-900"
          />
          Auto-tested only
        </label>
      </div>

      {/* Active filter chips with inline Clear all */}
      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ul className="contents">
            {activeChips.map((c) => (
              <li key={c.key}>
                <FilterChip label={c.label} onRemove={c.remove} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold text-zinc-600 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Count + exports */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {sorted.length}
          </span>{' '}
          of {rows.length} {totalLabel} controls.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Export
          </span>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={sorted.length === 0}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('json')}
            disabled={sorted.length === 0}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
          >
            JSON
          </button>
          <button
            type="button"
            onClick={() => handleExport('yaml')}
            disabled={sorted.length === 0}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:text-blue-300"
          >
            YAML
          </button>
        </div>
      </div>

      {/* "Showing X of Y" only when filters are active so the default view stays clean */}
      {activeChips.length > 0 && sorted.length > 0 && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Showing {sorted.length} of {rows.length} controls
        </p>
      )}

      {/* Table or empty state */}
      <div className="mt-4">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No controls match the current filters.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[860px] divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              <thead className="sticky top-0 z-10 bg-zinc-50 text-left shadow-[inset_0_-1px_0_0_rgb(228_228_231)] dark:bg-zinc-900/95 dark:shadow-[inset_0_-1px_0_0_rgb(39_39_42)] dark:backdrop-blur-sm">
                <tr>
                  <SortHeader
                    label="ID"
                    sortKey="id"
                    activeKey={sortBy}
                    dir={sortDir}
                    onClick={onHeaderClick}
                  />
                  <SortHeader
                    label="Clause"
                    sortKey="clause"
                    activeKey={sortBy}
                    dir={sortDir}
                    onClick={onHeaderClick}
                  />
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Short title
                  </th>
                  <SortHeader
                    label="Level"
                    sortKey="requirement_level"
                    activeKey={sortBy}
                    dir={sortDir}
                    onClick={onHeaderClick}
                  />
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Applies to
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Profile
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Evidence
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Auto-tested
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/60 dark:bg-zinc-950">
                {sorted.map((r) => (
                  <tr
                    key={r.id}
                    className="transition hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                  >
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <Link
                        href={`/modules/${moduleSlug}/controls/${r.slug}/`}
                        className="font-mono text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {r.id}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {r.clause}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/modules/${moduleSlug}/controls/${r.slug}/`}
                        className="text-zinc-800 hover:text-blue-700 hover:underline dark:text-zinc-200 dark:hover:text-blue-300"
                      >
                        {r.short_title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${MODAL_STYLES[r.requirement_level]}`}
                      >
                        {r.requirement_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <FacetTagList values={r.applies_to} labels={APPLIES_TO_LABEL} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <FacetTagList values={r.profile} labels={PROFILE_LABEL} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <FacetTagList values={r.evidence_type} labels={EVIDENCE_LABEL} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <AutoTestedDot autoTested={r.auto_tested} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Status dot for the "Auto-tested" column. Green when an automated
 * check is registered for this control, grey when not yet. The
 * native `title` attribute is the slow tooltip; rich popover behaviour
 * lives on the column header instead.
 */
function AutoTestedDot({ autoTested }: { autoTested: boolean }) {
  return (
    <span
      title={
        autoTested
          ? 'An automated test runs against your EAA for this control.'
          : 'No automated test for this control yet; the rule is documented but not auto-checked.'
      }
      className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full ${
          autoTested
            ? 'bg-emerald-500'
            : 'bg-zinc-300 dark:bg-zinc-700'
        }`}
      />
      <span className="sr-only">
        {autoTested ? 'Auto-tested' : 'Not auto-tested yet'}
      </span>
    </span>
  );
}

function FacetTagList({
  values,
  labels,
}: {
  values: string[];
  labels: Record<string, string>;
}) {
  return (
    <ul className="flex flex-wrap gap-1">
      {values.map((v) => (
        <li
          key={v}
          className="inline-flex items-center whitespace-nowrap rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
        >
          {labels[v] ?? v}
        </li>
      ))}
    </ul>
  );
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  return (
    <th
      scope="col"
      aria-sort={
        isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
      }
      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
    >
      <button
        type="button"
        onClick={() => onClick(sortKey)}
        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-zinc-900 dark:hover:text-white ${
          isActive ? 'text-zinc-900 dark:text-white' : ''
        }`}
      >
        {label}
        <span className="text-[10px]" aria-hidden="true">
          {isActive ? (dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}
