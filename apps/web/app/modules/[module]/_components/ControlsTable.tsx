import Link from 'next/link';
import type { Control } from '@iwc/controls';
import { controlIdToSlug } from '@iwc/shared';

const APPLIES_TO_LABEL: Record<string, string> = {
  'ordinary-eaa': 'Ordinary',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
  all: 'All',
};

const PROFILE_LABEL: Record<string, string> = {
  'sd-jwt-vc': 'SD-JWT VC',
  mdoc: 'mdoc',
  abstract: 'Abstract',
};

const ROLE_LABEL: Record<string, string> = {
  issuer: 'Issuer',
  verifier: 'Verifier',
  wallet: 'Wallet',
  rp: 'Relying Party',
  qtsp: 'QTSP',
  all: 'All',
};

const EVIDENCE_LABEL: Record<string, string> = {
  'eaa-payload': 'EAA payload',
  'eaa-header': 'EAA header',
  'issuer-cert': 'Issuer cert',
  'status-list': 'Status list',
  'type-metadata': 'Type metadata',
  'trust-list': 'Trust list',
};

const MODAL_STYLES = {
  shall:
    'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  should:
    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  may: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
} as const;

function FacetTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      {children}
    </span>
  );
}

export interface ControlsTableProps {
  controls: Control[];
  moduleSlug: string;
  emptyTitle?: string;
  emptyHint?: string;
}

export function ControlsTable({
  controls,
  moduleSlug,
  emptyTitle = 'No controls match this view yet.',
  emptyHint = 'New controls land here as the catalogue grows.',
}: ControlsTableProps) {
  if (controls.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {emptyTitle}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          {emptyHint}
        </p>
      </div>
    );
  }

  const sorted = [...controls].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
        <thead className="bg-zinc-50 text-left dark:bg-zinc-900/60">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              ID
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Short title
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Verb
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Applies to
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Evidence
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/60 dark:bg-zinc-950">
          {sorted.map((c) => (
            <tr
              key={c.id}
              className="transition hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
            >
              <td className="whitespace-nowrap px-4 py-3 align-top">
                <Link
                  href={`/modules/${moduleSlug}/controls/${controlIdToSlug(c.id)}/`}
                  className="font-mono text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
                >
                  {c.id}
                </Link>
              </td>
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/modules/${moduleSlug}/controls/${controlIdToSlug(c.id)}/`}
                  className="text-zinc-800 hover:text-blue-700 hover:underline dark:text-zinc-200 dark:hover:text-blue-300"
                >
                  {c.short_title}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 align-top">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${MODAL_STYLES[c.modal_verb]}`}
                >
                  {c.modal_verb}
                </span>
              </td>
              <td className="px-4 py-3 align-top">
                <ul className="flex flex-wrap gap-1">
                  {c.applies_to.map((t) => (
                    <li key={t}>
                      <FacetTag>{APPLIES_TO_LABEL[t] ?? t}</FacetTag>
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3 align-top">
                <ul className="flex flex-wrap gap-1">
                  {c.evidence_type.map((e) => (
                    <li key={e}>
                      <FacetTag>{EVIDENCE_LABEL[e] ?? e}</FacetTag>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { PROFILE_LABEL, ROLE_LABEL, APPLIES_TO_LABEL };
