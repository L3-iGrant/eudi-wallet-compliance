'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import type { AssessmentResult, Verdict } from '@iwc/engine';
import { loadAllControlsSync } from '@iwc/controls/sync';
import { controlIdToSlug } from '@iwc/shared';
import { reportStore } from '../../../../lib/storage';
import { resolveTenant } from '../../../../lib/tenant';

const STATUS_STYLE: Record<string, string> = {
  pass: 'text-emerald-700 dark:text-emerald-400',
  fail: 'text-red-700 dark:text-red-400',
  warn: 'text-amber-700 dark:text-amber-400',
  na: 'text-zinc-500 dark:text-zinc-500',
};

interface VerdictGroup {
  clause: string;
  verdicts: Verdict[];
}

/**
 * Top-level clause label, e.g. EAA-5.2.10.1-04 → "5.2", QEAA-5.6.2-01 →
 * "5.6". Anything we cannot parse is bucketed under "Other".
 */
function clauseOf(controlId: string): string {
  const match = controlId.match(/-(\d+\.\d+)/);
  return match ? match[1] : 'Other';
}

function compareClause(a: string, b: string): number {
  if (a === 'Other') return 1;
  if (b === 'Other') return -1;
  const [a1 = 0, a2 = 0] = a.split('.').map(Number);
  const [b1 = 0, b2 = 0] = b.split('.').map(Number);
  return a1 !== b1 ? a1 - b1 : a2 - b2;
}

function groupByClause(verdicts: Verdict[]): VerdictGroup[] {
  const groups = new Map<string, Verdict[]>();
  for (const v of verdicts) {
    const c = clauseOf(v.controlId);
    const list = groups.get(c) ?? [];
    list.push(v);
    groups.set(c, list);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => compareClause(a, b))
    .map(([clause, vs]) => ({ clause, verdicts: vs }));
}

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportFallback />}>
      <ReportInner />
    </Suspense>
  );
}

function ReportFallback() {
  return (
    <article className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm text-zinc-500">Loading report…</p>
    </article>
  );
}

function ReportInner() {
  const params = useSearchParams();
  const [report, setReport] = useState<AssessmentResult | null | undefined>(undefined);

  const moduleByControlId = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of loadAllControlsSync()) m.set(c.id, c.module);
    return m;
  }, []);

  useEffect(() => {
    const id = params.get('id');
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external URL state into local state on mount
      setReport(null);
      return;
    }
    void reportStore
      .getReport(resolveTenant(), id)
      .then((r) => setReport(r))
      .catch(() => setReport(null));
  }, [params]);

  const groupedVerdicts = useMemo<VerdictGroup[]>(() => {
    if (!report) return [];
    const active = report.verdicts.filter(
      (v) => v.status !== 'na' || v.notes !== 'No check implemented yet',
    );
    return groupByClause(active);
  }, [report]);

  if (report === undefined) {
    return (
      <article className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm text-zinc-500">Loading report…</p>
      </article>
    );
  }

  if (!report) {
    return (
      <article className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Report not found
        </h1>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
          Reports are kept in your browser for 30 days.{' '}
          <Link
            href="/eudi-wallet-compliance/self-assessment/"
            className="font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
          >
            Run another assessment.
          </Link>
        </p>
      </article>
    );
  }

  const totalRun = report.summary.pass + report.summary.fail + report.summary.warn;

  return (
    <article className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Assessment report
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        Report {report.reportId.slice(0, 8)}
      </h1>
      <p className="mt-2 text-xs text-zinc-500">
        Generated {new Date(report.createdAt).toLocaleString()} · stored locally for 30 days
      </p>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pass" value={report.summary.pass} accent="emerald" />
        <Stat label="Fail" value={report.summary.fail} accent="red" />
        <Stat label="Warn" value={report.summary.warn} accent="amber" />
        <Stat label="N/A" value={report.summary.na} accent="zinc" />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Verdicts ({totalRun} active checks)
        </h2>
        <div className="mt-4 space-y-3">
          {groupedVerdicts.map((g) => (
            <details
              key={g.clause}
              open
              className="group rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 p-3 text-sm font-medium text-zinc-950 dark:text-white">
                <span>Clause {g.clause}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  {g.verdicts.length} {g.verdicts.length === 1 ? 'check' : 'checks'}
                </span>
              </summary>
              <ul className="divide-y divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {g.verdicts.map((v) => {
                  const moduleId = moduleByControlId.get(v.controlId);
                  const slug = controlIdToSlug(v.controlId);
                  const href = moduleId
                    ? `/modules/${moduleId}/controls/${slug}/`
                    : null;
                  return (
                    <li key={v.controlId} className="grid grid-cols-12 gap-3 p-3 text-sm">
                      <span className="col-span-3 font-mono text-xs">
                        {href ? (
                          <Link
                            href={href}
                            className="text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
                          >
                            {v.controlId}
                          </Link>
                        ) : (
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {v.controlId}
                          </span>
                        )}
                      </span>
                      <span
                        className={`col-span-1 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLE[v.status]}`}
                      >
                        {v.status}
                      </span>
                      <span className="col-span-8 text-zinc-700 dark:text-zinc-300">
                        {v.notes}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Link
          href="/eudi-wallet-compliance/self-assessment/"
          className="text-sm font-semibold text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
        >
          Run another assessment
        </Link>
      </section>
    </article>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'emerald' | 'red' | 'amber' | 'zinc';
}) {
  const accentClass = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    red: 'text-red-700 dark:text-red-400',
    amber: 'text-amber-700 dark:text-amber-400',
    zinc: 'text-zinc-700 dark:text-zinc-300',
  }[accent];
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}
