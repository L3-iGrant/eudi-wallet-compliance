import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Circle,
} from '@react-pdf/renderer';
import type { AssessmentResult, Verdict } from '@iwc/engine';

// Brand palette mirrors the web report.
const BLUE = '#1d4ed8';
const EMERALD = '#047857';
const RED = '#b91c1c';
const AMBER = '#b45309';
const ZINC_950 = '#09090b';
const ZINC_700 = '#3f3f46';
const ZINC_500 = '#71717a';
const ZINC_200 = '#e4e4e7';

const STATUS_COLOUR: Record<string, string> = {
  pass: EMERALD,
  fail: RED,
  warn: AMBER,
  na: ZINC_500,
};

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: ZINC_700,
  },
  brand: {
    fontSize: 9,
    color: BLUE,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  h1: {
    fontSize: 22,
    color: ZINC_950,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
  },
  h2: {
    fontSize: 13,
    color: ZINC_950,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 18,
  },
  meta: {
    fontSize: 9,
    color: ZINC_500,
    marginBottom: 24,
  },
  scopeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  scopeLabel: {
    width: 90,
    fontFamily: 'Helvetica-Bold',
    color: ZINC_950,
  },
  summarySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  summaryGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    border: `1pt solid ${ZINC_200}`,
    borderRadius: 6,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 8,
    color: ZINC_500,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: `1pt solid ${ZINC_200}`,
    paddingBottom: 6,
    marginTop: 12,
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: ZINC_500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottom: `0.5pt solid ${ZINC_200}`,
  },
  clauseHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: ZINC_950,
    marginTop: 12,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: `0.5pt solid ${ZINC_200}`,
  },
  colControl: { width: '28%', fontFamily: 'Courier', fontSize: 8 },
  colStatus: { width: '10%', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  colNotes: { width: '62%', fontSize: 9 },
  gapCard: {
    border: `1pt solid ${ZINC_200}`,
    borderRadius: 6,
    padding: 12,
    marginTop: 10,
  },
  gapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gapBadgePass: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: EMERALD,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gapBadgeFail: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: AMBER,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gapSubhead: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: ZINC_500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  gapList: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: ZINC_700,
    lineHeight: 1.5,
  },
  unimplementedNote: {
    fontSize: 9,
    color: ZINC_500,
    marginTop: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: ZINC_500,
    borderTop: `0.5pt solid ${ZINC_200}`,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cta: {
    marginTop: 28,
    border: `1pt solid ${ZINC_200}`,
    borderRadius: 6,
    padding: 14,
    backgroundColor: '#f4f4f5',
  },
  ctaText: {
    fontSize: 9,
    color: ZINC_700,
  },
  ctaEmail: {
    color: BLUE,
    fontFamily: 'Helvetica-Bold',
  },
});

const TIER_LABEL: Record<string, string> = {
  ordinary: 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
};
const PROFILE_LABEL: Record<string, string> = {
  'sd-jwt-vc': 'SD-JWT VC',
  mdoc: 'ISO mdoc',
};
const ROLE_LABEL: Record<string, string> = {
  issuer: 'Issuer',
  verifier: 'Verifier',
};

const ROWS_PER_PAGE = 25;

/** Top-level clause label, e.g. EAA-5.2.10.1-04 -> "5.2". */
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
 * Flatten verdicts into a stream of "row items" in clause order, with
 * heading rows injected at each clause boundary. The verdicts pages
 * then chunk this stream into pages so headings stay together with
 * their group.
 */
type RowItem =
  | { kind: 'heading'; clause: string; count: number }
  | { kind: 'verdict'; verdict: Verdict };

function flattenWithHeadings(verdicts: Verdict[]): RowItem[] {
  const sorted = [...verdicts].sort((a, b) => {
    const c = compareClause(clauseOf(a.controlId), clauseOf(b.controlId));
    return c !== 0 ? c : a.controlId.localeCompare(b.controlId);
  });
  const counts = new Map<string, number>();
  for (const v of sorted) {
    const c = clauseOf(v.controlId);
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const items: RowItem[] = [];
  let lastClause: string | null = null;
  for (const v of sorted) {
    const c = clauseOf(v.controlId);
    if (c !== lastClause) {
      items.push({ kind: 'heading', clause: c, count: counts.get(c) ?? 0 });
      lastClause = c;
    }
    items.push({ kind: 'verdict', verdict: v });
  }
  return items;
}

interface ConformanceReportPdfProps {
  report: AssessmentResult;
}

export function ConformanceReportPdf({ report }: ConformanceReportPdfProps) {
  const activeVerdicts = report.verdicts.filter(
    (v) => v.status !== 'na' || v.notes !== 'No check implemented yet',
  );
  const unimplementedCount = report.verdicts.length - activeVerdicts.length;
  const items = flattenWithHeadings(activeVerdicts);
  const pages: RowItem[][] = [];
  for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
    pages.push(items.slice(i, i + ROWS_PER_PAGE));
  }
  const totalPages = 1 + Math.max(pages.length, 1) + 1;

  return (
    <Document title={`Conformance Report ${report.reportId.slice(0, 8)}`}>
      <CoverPage
        report={report}
        unimplementedCount={unimplementedCount}
        totalPages={totalPages}
      />
      {pages.length === 0 ? (
        <VerdictsPage
          items={[]}
          report={report}
          pageNumber={2}
          totalPages={totalPages}
          isFirst
          isLast
        />
      ) : (
        pages.map((chunk, i) => (
          <VerdictsPage
            key={i}
            items={chunk}
            report={report}
            pageNumber={i + 2}
            totalPages={totalPages}
            isFirst={i === 0}
            isLast={i === pages.length - 1}
          />
        ))
      )}
      <ClosingPage report={report} pageNumber={totalPages} totalPages={totalPages} />
    </Document>
  );
}

/**
 * Donut chart for the PDF cover page. Mirrors the web report's
 * VerdictDonut: pass / fail / warn segments only, N/A excluded.
 *
 * No chart library; one stroked Circle per segment with
 * strokeDasharray sized to its fraction of the total and
 * strokeDashoffset advancing per segment so segments sit
 * end-to-end. Renders nothing when there are no decisive verdicts.
 */
function VerdictDonutPdf({
  summary,
}: {
  summary: { pass: number; fail: number; warn: number; na: number };
}) {
  const total = summary.pass + summary.fail + summary.warn;
  if (total === 0) return null;

  const r = 35;
  const c = 2 * Math.PI * r;
  const segments: Array<{ count: number; colour: string }> = [
    { count: summary.pass, colour: EMERALD },
    { count: summary.fail, colour: RED },
    { count: summary.warn, colour: AMBER },
  ];

  let cumulative = 0;
  const arcs = segments
    .filter((s) => s.count > 0)
    .map((s) => {
      const len = (s.count / total) * c;
      const offset = -cumulative;
      cumulative += len;
      return { len, offset, colour: s.colour };
    });

  return (
    <Svg width={90} height={90} viewBox="-50 -50 100 100">
      <Circle
        cx={0}
        cy={0}
        r={r}
        fill="none"
        stroke={ZINC_200}
        strokeWidth={12}
      />
      {arcs.map((a, i) => (
        <Circle
          key={i}
          cx={0}
          cy={0}
          r={r}
          fill="none"
          stroke={a.colour}
          strokeWidth={12}
          strokeDasharray={`${a.len} ${c - a.len}`}
          strokeDashoffset={a.offset}
          transform="rotate(-90)"
        />
      ))}
    </Svg>
  );
}

function CoverPage({
  report,
  unimplementedCount,
  totalPages,
}: {
  report: AssessmentResult;
  unimplementedCount: number;
  totalPages: number;
}) {
  const totalInScope = report.verdicts.length;
  const activeCount = totalInScope - unimplementedCount;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>iGrant.io · EUDI Wallet Compliance</Text>
      <Text style={styles.h1}>Conformance Report</Text>
      <Text style={styles.meta}>
        Report {report.reportId} · generated {formatDate(report.createdAt)}
      </Text>

      <Text style={styles.h2}>Scope</Text>
      <ScopeRow label="Module" value="EAA Conformance" />
      <ScopeRow
        label="Profile"
        value={report.scope.profile.map((p) => PROFILE_LABEL[p] ?? p).join(', ')}
      />
      <ScopeRow
        label="Role"
        value={report.scope.role.map((r) => ROLE_LABEL[r] ?? r).join(', ')}
      />
      <ScopeRow
        label="Tier"
        value={TIER_LABEL[report.scope.tier] ?? report.scope.tier}
      />

      <Text style={styles.h2}>Summary</Text>
      <View style={styles.summarySection}>
        <VerdictDonutPdf summary={report.summary} />
        <View style={styles.summaryGrid}>
          <SummaryCard label="Pass" value={report.summary.pass} colour={EMERALD} />
          <SummaryCard label="Fail" value={report.summary.fail} colour={RED} />
          <SummaryCard label="Warn" value={report.summary.warn} colour={AMBER} />
          <SummaryCard label="N/A" value={report.summary.na} colour={ZINC_700} />
        </View>
      </View>
      {unimplementedCount > 0 && (
        <Text style={styles.unimplementedNote}>
          {unimplementedCount} of {totalInScope} controls in scope have no
          engine check yet; only the {activeCount} active checks are reflected
          in the counts above.
        </Text>
      )}

      <PageFooter pageNumber={1} totalPages={totalPages} />
    </Page>
  );
}

function VerdictsPage({
  items,
  report,
  pageNumber,
  totalPages,
  isFirst,
  isLast,
}: {
  items: RowItem[];
  report: AssessmentResult;
  pageNumber: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const verdictCount = items.filter((i) => i.kind === 'verdict').length;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>iGrant.io · EUDI Wallet Compliance</Text>
      {isFirst && (
        <>
          <Text style={styles.h1}>Verdicts</Text>
          <Text style={styles.meta}>
            {report.verdicts.length} controls in scope ·{' '}
            {report.summary.pass + report.summary.fail + report.summary.warn} active
            checks executed, grouped by clause
          </Text>
        </>
      )}
      {verdictCount === 0 ? (
        <Text style={{ fontSize: 10, color: ZINC_500, marginTop: 8 }}>
          No active verdicts to report. Either no checks were registered for the
          chosen scope, or every applicable control returned N/A because the
          required evidence was not supplied.
        </Text>
      ) : (
        items.map((item, idx) => {
          if (item.kind === 'heading') {
            return (
              <View key={`h-${item.clause}-${idx}`} wrap={false}>
                <Text style={styles.clauseHeading}>
                  Clause {item.clause}{'  '}
                  <Text style={{ color: ZINC_500, fontFamily: 'Helvetica' }}>
                    ({item.count} {item.count === 1 ? 'check' : 'checks'})
                  </Text>
                </Text>
                <View style={styles.tableHeader}>
                  <Text style={styles.colControl}>Control</Text>
                  <Text style={styles.colStatus}>Status</Text>
                  <Text style={styles.colNotes}>Notes</Text>
                </View>
              </View>
            );
          }
          const v = item.verdict;
          return (
            <View key={v.controlId} style={styles.tableRow} wrap={false}>
              <Text style={styles.colControl}>{v.controlId}</Text>
              <Text style={[styles.colStatus, { color: STATUS_COLOUR[v.status] }]}>
                {v.status.toUpperCase()}
              </Text>
              <Text style={styles.colNotes}>{v.notes}</Text>
            </View>
          );
        })
      )}
      {isLast && (
        <Text style={styles.unimplementedNote}>
          {
            'Verdicts that returned N/A with the standard "No check implemented yet" note are omitted; the engine ships fewer than the catalogue total.'
          }
        </Text>
      )}
      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </Page>
  );
}

interface TierGap {
  label: string;
  canBe: boolean;
  missing: string[];
  additionallyRequired: string[];
}

function buildGaps(report: AssessmentResult): TierGap[] {
  const gaps: TierGap[] = [];
  if (report.scope.tier === 'ordinary' || report.scope.tier === 'qeaa') {
    if (report.scope.tier === 'ordinary') {
      gaps.push({
        label: TIER_LABEL.qeaa ?? 'QEAA',
        canBe: report.gapAnalysis.canBeQeaa,
        missing: report.gapAnalysis.missingForQeaa,
        additionallyRequired: report.gapAnalysis.additionallyRequiredForQeaa,
      });
    }
    gaps.push({
      label: TIER_LABEL['pub-eaa'] ?? 'PuB-EAA',
      canBe: report.gapAnalysis.canBePubEaa,
      missing: report.gapAnalysis.missingForPubEaa,
      additionallyRequired: report.gapAnalysis.additionallyRequiredForPubEaa,
    });
  }
  return gaps;
}

function GapCardPdf({ gap }: { gap: TierGap }) {
  return (
    <View style={styles.gapCard} wrap={false}>
      <View style={styles.gapHeader}>
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: ZINC_950 }}>
          {gap.label}
        </Text>
        <Text style={gap.canBe ? styles.gapBadgePass : styles.gapBadgeFail}>
          {gap.canBe
            ? 'Would pass'
            : `${gap.missing.length} blocker${gap.missing.length === 1 ? '' : 's'}`}
        </Text>
      </View>
      {gap.canBe ? (
        <Text style={{ fontSize: 9, color: ZINC_700 }}>
          No control fails at this tier with the supplied evidence.
        </Text>
      ) : (
        <>
          <Text style={styles.gapSubhead}>Would fail at this tier</Text>
          <Text style={styles.gapList}>{gap.missing.join('  ·  ')}</Text>
        </>
      )}
      {gap.additionallyRequired.length > 0 && (
        <>
          <Text style={styles.gapSubhead}>
            Additionally required at {gap.label}
          </Text>
          <Text style={{ fontSize: 9, color: ZINC_700, marginBottom: 4 }}>
            {gap.additionallyRequired.length} additional control
            {gap.additionallyRequired.length === 1 ? '' : 's'} would need to be
            addressed:
          </Text>
          <Text style={styles.gapList}>
            {gap.additionallyRequired.join('  ·  ')}
          </Text>
        </>
      )}
    </View>
  );
}

function ClosingPage({
  report,
  pageNumber,
  totalPages,
}: {
  report: AssessmentResult;
  pageNumber: number;
  totalPages: number;
}) {
  const gaps = buildGaps(report);
  const allClear =
    gaps.length > 0 &&
    gaps.every((g) => g.canBe && g.additionallyRequired.length === 0);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>iGrant.io · EUDI Wallet Compliance</Text>
      <Text style={styles.h1}>Gap analysis</Text>
      {gaps.length === 0 ? (
        <Text style={{ fontSize: 10, marginBottom: 18 }}>
          The chosen scope is already at the highest tier (PuB-EAA), so no
          tier transitions remain.
        </Text>
      ) : (
        <>
          <Text style={{ fontSize: 10, marginBottom: 6 }}>
            Two signals per tier card: controls that would fail if assessed at
            the higher tier (behaviour-aware), and controls that become
            required at the higher tier and are not yet passing (catalogue
            upgrade delta).
          </Text>
          {allClear && (
            <Text
              style={{
                fontSize: 10,
                color: EMERALD,
                marginTop: 8,
                marginBottom: 4,
              }}
            >
              This EAA satisfies all controls required for QEAA and PuB-EAA tiers.
            </Text>
          )}
          {gaps.map((g) => (
            <GapCardPdf key={g.label} gap={g} />
          ))}
        </>
      )}

      <Text style={styles.h2}>Methodology</Text>
      <Text style={{ fontSize: 10, marginBottom: 6 }}>
        Built against ETSI TS 119 472-1 v1.2.1 and the broader EUDI Wallet
        specification stack (ETSI, IETF, ISO, OpenID, W3C). Each control entry
        in this report links back to a clause in the source specification; see
        the catalogue at the iGrant.io public toolkit for the full citation.
      </Text>
      <Text style={{ fontSize: 10, marginBottom: 6 }}>
        Evidence supplied in this run: {report.evidenceRefs.join(', ') || 'none'}.
      </Text>

      <View style={styles.cta}>
        <Text style={styles.ctaText}>
          {"Want help closing these gaps? Contact iGrant.io's solutions team at "}
          <Text style={styles.ctaEmail}>support@igrant.io</Text>.
        </Text>
      </View>

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </Page>
  );
}

function ScopeRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scopeRow}>
      <Text style={styles.scopeLabel}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colour }]}>{value}</Text>
    </View>
  );
}

function PageFooter({
  pageNumber,
  totalPages,
}: {
  pageNumber: number;
  totalPages: number;
}) {
  return (
    <View style={styles.footer}>
      <Text>Built on TS 119 472-1 v1.2.1 · Maintained by iGrant.io</Text>
      <Text>
        Page {pageNumber} of {totalPages}
      </Text>
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB');
  } catch {
    return iso;
  }
}
