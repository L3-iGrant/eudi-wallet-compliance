'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import type { AssessmentResult } from '@iwc/engine';
import { reportStore } from '../../../../lib/storage';
import { resolveTenant } from '../../../../lib/tenant';

const STATUS_STYLE: Record<string, string> = {
  pass: 'text-emerald-700 dark:text-emerald-400',
  fail: 'text-red-700 dark:text-red-400',
  warn: 'text-amber-700 dark:text-amber-400',
  na: 'text-zinc-500 dark:text-zinc-500',
};

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
        <ul className="mt-4 divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {report.verdicts
            .filter((v) => v.status !== 'na' || v.notes !== 'No check implemented yet')
            .map((v) => (
              <li key={v.controlId} className="grid grid-cols-12 gap-3 p-3 text-sm">
                <span className="col-span-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {v.controlId}
                </span>
                <span
                  className={`col-span-1 text-xs font-semibold uppercase tracking-wider ${STATUS_STYLE[v.status]}`}
                >
                  {v.status}
                </span>
                <span className="col-span-8 text-zinc-700 dark:text-zinc-300">{v.notes}</span>
              </li>
            ))}
        </ul>
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
