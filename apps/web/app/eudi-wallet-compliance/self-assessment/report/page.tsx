'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import type { AssessmentResult, Verdict } from '@iwc/engine';
import { loadAllControlsSync } from '@iwc/controls/sync';
import { controlIdToSlug } from '@iwc/shared';
import { reportStore } from '../../../../lib/storage';
import { leadsStore, type Lead } from '../../../../lib/leads';
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

/**
 * Build the "Re-test" link for a single verdict on the report. Carries
 * the report's scope so the upload page lands ready to run, and the
 * fromReport / focus params so the EAA is pre-filled and the new run
 * lands focused on the same control.
 *
 * Profile and role can be multi-valued in the catalogue's scope; the
 * upload page accepts a single value per dropdown, so we pick the
 * first concrete one. The tier field is already a single value in
 * engine form ("ordinary" / "qeaa" / "pub-eaa") so it passes through.
 */
function buildRetestLink(
  report: AssessmentResult,
  controlId: string,
): string {
  // AssessmentScope already constrains profile to sd-jwt-vc/mdoc and
  // role to issuer/verifier (no "abstract" or "all" sentinels), so no
  // coercion is needed here. The values come from a real assessment;
  // pick the first.
  const params = new URLSearchParams({
    module: report.scope.module,
    role: report.scope.role[0] ?? 'issuer',
    profile: report.scope.profile[0] ?? 'sd-jwt-vc',
    tier: report.scope.tier,
    focus: controlId,
    fromReport: report.reportId,
  });
  return `/eudi-wallet-compliance/self-assessment/upload/?${params.toString()}`;
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

type StatusFilter = 'pass' | 'fail' | 'warn' | 'na';

function ReportInner() {
  const params = useSearchParams();
  const [report, setReport] = useState<AssessmentResult | null | undefined>(undefined);
  const [lead, setLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  // ?focus=<control_id> drops the user onto a single-rule view of the
  // report. Set when arriving from the per-control CTA on a control
  // detail page; cleared by the user clicking "Show all controls".
  const [focusedControlId, setFocusedControlId] = useState<string | null>(
    () => params.get('focus'),
  );

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
    const tenantId = resolveTenant();
    void Promise.all([
      reportStore.getReport(tenantId, id),
      leadsStore.getLeadByReportId(tenantId, id),
    ])
      .then(([r, l]) => {
        setReport(r);
        setLead(l);
      })
      .catch(() => setReport(null));
  }, [params]);

  const { groupedVerdicts, activeSummary, unimplementedCount, totalInScope } =
    useMemo(() => {
      if (!report) {
        return {
          groupedVerdicts: [] as VerdictGroup[],
          activeSummary: { pass: 0, fail: 0, warn: 0, na: 0 },
          unimplementedCount: 0,
          totalInScope: 0,
        };
      }
      const active = report.verdicts.filter(
        (v) => v.status !== 'na' || v.notes !== 'No check implemented yet',
      );
      const summary = active.reduce(
        (acc, v) => {
          acc[v.status] += 1;
          return acc;
        },
        { pass: 0, fail: 0, warn: 0, na: 0 } as Record<
          'pass' | 'fail' | 'warn' | 'na',
          number
        >,
      );
      return {
        groupedVerdicts: groupByClause(active),
        activeSummary: summary,
        unimplementedCount: report.verdicts.length - active.length,
        totalInScope: report.verdicts.length,
      };
    }, [report]);

  // Hooks must run on every render in the same order. Keep this useMemo
  // above the conditional early returns below so the hook count is stable
  // between the report-undefined and report-loaded renders.
  const filteredGroups = useMemo(() => {
    if (focusedControlId === null && statusFilter === null) return groupedVerdicts;
    return groupedVerdicts
      .map((g) => ({
        ...g,
        verdicts: g.verdicts.filter((v) => {
          if (focusedControlId !== null && v.controlId !== focusedControlId)
            return false;
          if (statusFilter !== null && v.status !== statusFilter) return false;
          return true;
        }),
      }))
      .filter((g) => g.verdicts.length > 0);
  }, [groupedVerdicts, statusFilter, focusedControlId]);
  // The focused verdict, if any. Surfaces in the banner so the user
  // sees the result for the rule they came here to check, before
  // scrolling through anything else.
  const focusedVerdict = useMemo(() => {
    if (focusedControlId === null) return null;
    for (const g of groupedVerdicts) {
      const match = g.verdicts.find((v) => v.controlId === focusedControlId);
      if (match) return match;
    }
    return null;
  }, [groupedVerdicts, focusedControlId]);
  const focusedNotInScope =
    focusedControlId !== null && focusedVerdict === null;

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

  const totalRun = activeSummary.pass + activeSummary.fail + activeSummary.warn;
  const totalActive = totalRun + activeSummary.na;
  const filteredVerdictCount = filteredGroups.reduce(
    (n, g) => n + g.verdicts.length,
    0,
  );
  const toggleStatusFilter = (s: 'pass' | 'fail' | 'warn' | 'na') => {
    setStatusFilter((curr) => (curr === s ? null : s));
  };

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

      <section className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
        <VerdictDonut summary={activeSummary} />
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Pass"
            value={activeSummary.pass}
            accent="emerald"
            active={statusFilter === 'pass'}
            onClick={() => toggleStatusFilter('pass')}
          />
          <Stat
            label="Fail"
            value={activeSummary.fail}
            accent="red"
            active={statusFilter === 'fail'}
            onClick={() => toggleStatusFilter('fail')}
          />
          <Stat
            label="Warn"
            value={activeSummary.warn}
            accent="amber"
            active={statusFilter === 'warn'}
            onClick={() => toggleStatusFilter('warn')}
          />
          <Stat
            label="N/A"
            value={activeSummary.na}
            accent="zinc"
            active={statusFilter === 'na'}
            onClick={() => toggleStatusFilter('na')}
          />
        </div>
      </section>
      {unimplementedCount > 0 && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          {unimplementedCount} of {totalInScope} controls in scope aren't auto-tested yet; only the {totalInScope - unimplementedCount} auto-tested controls are reflected in the counts above.
        </p>
      )}

      {focusedControlId !== null && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Verdict for this control
            </p>
            <button
              type="button"
              onClick={() => setFocusedControlId(null)}
              className="text-xs font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Show all controls
            </button>
          </div>
          {focusedVerdict ? (
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  focusedVerdict.status === 'pass'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : focusedVerdict.status === 'fail'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : focusedVerdict.status === 'warn'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {focusedVerdict.status}
              </span>
              <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                {focusedControlId}
              </span>
              <p className="basis-full text-sm text-zinc-700 dark:text-zinc-300">
                {focusedVerdict.notes || '(no engine notes)'}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                {focusedControlId}
              </span>{' '}
              {focusedNotInScope
                ? "isn't in scope for the current assessment, so it has no verdict. Try clearing the focus and re-running with a different scope."
                : 'has no verdict yet.'}
            </p>
          )}
        </div>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Verdicts (
            {statusFilter === null && focusedControlId === null
              ? `${totalActive} active checks`
              : `${filteredVerdictCount} of ${totalActive}${focusedControlId ? `, focused on ${focusedControlId}` : ''}${statusFilter ? `, filtered to ${statusFilter.toUpperCase()}` : ''}`}
            )
          </h2>
          {(statusFilter !== null || focusedControlId !== null) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter(null);
                setFocusedControlId(null);
              }}
              className="text-xs font-semibold text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {filteredGroups.length === 0 && (
            <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
              {focusedNotInScope
                ? `${focusedControlId} is not in scope for the current assessment.`
                : `No verdicts with status ${statusFilter?.toUpperCase()} in this report.`}
            </p>
          )}
          {filteredGroups.map((g) => (
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
                      <span className="col-span-7 text-zinc-700 dark:text-zinc-300">
                        {v.notes}
                      </span>
                      <span className="col-span-1 text-right">
                        <Link
                          href={buildRetestLink(report, v.controlId)}
                          title="Re-test this control with the same EAA pre-filled"
                          className="text-xs font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
                        >
                          Re-test
                        </Link>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <GapAnalysisSection report={report} moduleByControlId={moduleByControlId} />

      <DownloadSection
        report={report}
        lead={lead}
        onLeadCaptured={(l) => setLead(l)}
      />

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

const TIER_LABEL: Record<string, string> = {
  ordinary: 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
};

interface TierGap {
  label: string;
  canBe: boolean;
  missing: string[];
  additionallyRequired: string[];
}

function GapAnalysisSection({
  report,
  moduleByControlId,
}: {
  report: AssessmentResult;
  moduleByControlId: Map<string, string>;
}) {
  const gaps: TierGap[] = [];
  // Only show tiers above the chosen one. PuB-EAA scope hides the
  // section entirely (already at the top of the stack).
  if (report.scope.tier === 'ordinary' || report.scope.tier === 'qeaa') {
    if (report.scope.tier === 'ordinary') {
      gaps.push({
        label: TIER_LABEL.qeaa!,
        canBe: report.gapAnalysis.canBeQeaa,
        missing: report.gapAnalysis.missingForQeaa,
        additionallyRequired: report.gapAnalysis.additionallyRequiredForQeaa,
      });
    }
    gaps.push({
      label: TIER_LABEL['pub-eaa']!,
      canBe: report.gapAnalysis.canBePubEaa,
      missing: report.gapAnalysis.missingForPubEaa,
      additionallyRequired: report.gapAnalysis.additionallyRequiredForPubEaa,
    });
  }
  if (gaps.length === 0) return null;

  const allClear = gaps.every(
    (g) => g.canBe && g.additionallyRequired.length === 0,
  );

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        Gap analysis
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Would this credential pass at a higher tier? Two signals per card:
        controls that would <em>fail</em> if assessed at the higher tier
        (behaviour-aware), and controls that <em>become required</em> at
        the higher tier and are not yet passing (catalogue-level upgrade
        delta).
      </p>
      {allClear && (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          This EAA satisfies all controls required for QEAA and PuB-EAA tiers.
        </p>
      )}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {gaps.map((g) => (
          <GapCard key={g.label} gap={g} moduleByControlId={moduleByControlId} />
        ))}
      </div>
    </section>
  );
}

function GapCard({
  gap,
  moduleByControlId,
}: {
  gap: TierGap;
  moduleByControlId: Map<string, string>;
}) {
  const accent = gap.canBe
    ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/30'
    : 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/30';
  return (
    <article className={`rounded-md border p-4 ${accent}`}>
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
          {gap.label}
        </h3>
        {gap.canBe ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            Would pass
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
            />
            {gap.missing.length} blocker{gap.missing.length === 1 ? '' : 's'}
          </span>
        )}
      </header>
      {gap.canBe ? (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          No control fails at this tier with the supplied evidence.
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Would fail at this tier
          </p>
          <ControlList ids={gap.missing} moduleByControlId={moduleByControlId} />
        </>
      )}
      {gap.additionallyRequired.length > 0 && (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            Additionally required at {gap.label}
          </p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            To upgrade this EAA to {gap.label}, you would need to address{' '}
            {gap.additionallyRequired.length} additional control
            {gap.additionallyRequired.length === 1 ? '' : 's'}:
          </p>
          <ControlList
            ids={gap.additionallyRequired}
            moduleByControlId={moduleByControlId}
          />
        </>
      )}
    </article>
  );
}

function ControlList({
  ids,
  moduleByControlId,
}: {
  ids: string[];
  moduleByControlId: Map<string, string>;
}) {
  return (
    <ul className="mt-2 space-y-1">
      {ids.map((cid) => {
        const moduleId = moduleByControlId.get(cid);
        const href = moduleId
          ? `/modules/${moduleId}/controls/${controlIdToSlug(cid)}/`
          : null;
        return (
          <li key={cid} className="font-mono text-xs">
            {href ? (
              <Link
                href={href}
                className="text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
              >
                {cid}
              </Link>
            ) : (
              <span className="text-zinc-700 dark:text-zinc-300">{cid}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DownloadSection({
  report,
  lead,
  onLeadCaptured,
}: {
  report: AssessmentResult;
  lead: Lead | null;
  onLeadCaptured: (lead: Lead) => void;
}) {
  return (
    <section
      data-testid="download-section"
      className="mt-10 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
        Download this report
      </h2>
      {lead ? (
        <DownloadButtons report={report} />
      ) : (
        <EmailGate report={report} onLeadCaptured={onLeadCaptured} />
      )}
    </section>
  );
}

function EmailGate({
  report,
  onLeadCaptured,
}: {
  report: AssessmentResult;
  onLeadCaptured: (lead: Lead) => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const newLead: Lead = {
        reportId: report.reportId,
        email: email.trim(),
        projectId: null,
        capturedAt: new Date().toISOString(),
      };
      await leadsStore.saveLead(resolveTenant(), newLead);
      onLeadCaptured(newLead);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3">
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Tell us where to send conformance updates and unlock the PDF and JSON
        downloads. The address is stored locally; we use it to email you about
        new modules and breaking changes.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-300 focus:outline-2 focus:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Unlock downloads
        </button>
      </div>
      {error && (
        <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}

function DownloadButtons({ report }: { report: AssessmentResult }) {
  const [busy, setBusy] = useState<'pdf' | 'json' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filenameStem = `conformance-report-${report.reportId.slice(0, 8)}`;

  const downloadPdf = async () => {
    setBusy('pdf');
    setError(null);
    try {
      const [{ pdf }, { ConformanceReportPdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/pdf/ConformanceReportPdf'),
      ]);
      const blob = await pdf(<ConformanceReportPdf report={report} />).toBlob();
      triggerDownload(blob, `${filenameStem}.pdf`);
    } catch (err) {
      setError(`Could not build PDF: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const downloadJson = () => {
    setBusy('json');
    setError(null);
    try {
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      triggerDownload(blob, `${filenameStem}.json`);
    } catch (err) {
      setError(`Could not build JSON: ${(err as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-emerald-700 dark:text-emerald-400">
        Email captured. Downloads unlocked.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={downloadPdf}
          disabled={busy !== null}
          data-testid="download-pdf"
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {busy === 'pdf' ? 'Building PDF…' : 'Download PDF'}
        </button>
        <button
          type="button"
          onClick={downloadJson}
          disabled={busy !== null}
          data-testid="download-json"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-blue-300 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
        >
          {busy === 'json' ? 'Building JSON…' : 'Download JSON'}
        </button>
      </div>
      {error && (
        <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the click handler returns so Safari has a chance to read it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Stat({
  label,
  value,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: number;
  accent: 'emerald' | 'red' | 'amber' | 'zinc';
  active?: boolean;
  onClick?: () => void;
}) {
  const accentClass = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    red: 'text-red-700 dark:text-red-400',
    amber: 'text-amber-700 dark:text-amber-400',
    zinc: 'text-zinc-700 dark:text-zinc-300',
  }[accent];
  // Active state mirrors the accent so the highlight reads as "this filter
  // is the live one". Inactive cards keep the neutral border to avoid noise.
  const ringClass = active
    ? {
        emerald:
          'border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-300/60 dark:border-emerald-700 dark:bg-emerald-950/40 dark:ring-emerald-700/40',
        red: 'border-red-300 bg-red-50/60 ring-2 ring-red-300/60 dark:border-red-700 dark:bg-red-950/40 dark:ring-red-700/40',
        amber:
          'border-amber-300 bg-amber-50/60 ring-2 ring-amber-300/60 dark:border-amber-700 dark:bg-amber-950/40 dark:ring-amber-700/40',
        zinc: 'border-zinc-400 bg-zinc-50 ring-2 ring-zinc-300/60 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-zinc-700/40',
      }[accent]
    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950';
  const className = `block w-full rounded-lg border p-4 text-left transition ${ringClass} ${onClick ? 'cursor-pointer hover:border-zinc-300 hover:shadow-sm dark:hover:border-zinc-700' : ''}`;
  const inner = (
    <>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-semibold ${accentClass}`}>{value}</p>
    </>
  );
  if (!onClick) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={className}
    >
      {inner}
    </button>
  );
}

/**
 * Inline SVG donut summarising pass / fail / warn. N/A is intentionally
 * excluded: it represents "not applicable to this evidence", not a
 * conformance signal, so mixing it into the chart muddies the read.
 * The N/A count still appears on the dedicated stat card beside the
 * chart, where it belongs.
 *
 * No chart library: each segment is a stroked <circle> with
 * stroke-dasharray sized to its fraction of the total, and
 * stroke-dashoffset advancing per segment so they sit end-to-end.
 * Renders nothing when there are no decisive verdicts.
 */
function VerdictDonut({
  summary,
}: {
  summary: { pass: number; fail: number; warn: number; na: number };
}) {
  const total = summary.pass + summary.fail + summary.warn;
  if (total === 0) return null;

  const r = 40;
  const circumference = 2 * Math.PI * r;
  const segments: Array<{ key: string; count: number; className: string }> = [
    { key: 'pass', count: summary.pass, className: 'stroke-emerald-500' },
    { key: 'fail', count: summary.fail, className: 'stroke-red-500' },
    { key: 'warn', count: summary.warn, className: 'stroke-amber-500' },
  ];

  let cumulative = 0;
  const arcs = segments
    .filter((s) => s.count > 0)
    .map((s) => {
      const len = (s.count / total) * circumference;
      const offset = -cumulative;
      cumulative += len;
      return {
        key: s.key,
        len,
        offset,
        className: s.className,
      };
    });

  const ariaLabel = `${summary.pass} pass, ${summary.fail} fail, ${summary.warn} warn, out of ${total} decisive verdicts.`;

  return (
    <div className="flex items-center justify-center">
      <svg
        width="140"
        height="140"
        viewBox="-60 -60 120 120"
        role="img"
        aria-label={ariaLabel}
      >
        <circle
          r={r}
          fill="none"
          strokeWidth="14"
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        {arcs.map((a) => (
          <circle
            key={a.key}
            r={r}
            fill="none"
            strokeWidth="14"
            strokeLinecap="butt"
            strokeDasharray={`${a.len} ${circumference - a.len}`}
            strokeDashoffset={a.offset}
            transform="rotate(-90)"
            className={a.className}
          />
        ))}
        <text
          x="0"
          y="2"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-zinc-950 text-[20px] font-semibold dark:fill-white"
        >
          {total}
        </text>
        <text
          x="0"
          y="20"
          textAnchor="middle"
          className="fill-zinc-500 text-[9px] font-medium uppercase tracking-wider dark:fill-zinc-500"
        >
          {total === 1 ? 'verdict' : 'verdicts'}
        </text>
      </svg>
    </div>
  );
}
