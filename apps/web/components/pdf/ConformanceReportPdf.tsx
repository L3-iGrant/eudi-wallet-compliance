import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
  colControl: { width: '28%', fontFamily: 'Courier', fontSize: 8 },
  colStatus: { width: '10%', fontFamily: 'Helvetica-Bold', fontSize: 8 },
  colNotes: { width: '62%', fontSize: 9 },
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

const VERDICTS_PER_PAGE = 28;

interface ConformanceReportPdfProps {
  report: AssessmentResult;
}

export function ConformanceReportPdf({ report }: ConformanceReportPdfProps) {
  const activeVerdicts = report.verdicts.filter(
    (v) => v.status !== 'na' || v.notes !== 'No check implemented yet',
  );
  const pages: Verdict[][] = [];
  for (let i = 0; i < activeVerdicts.length; i += VERDICTS_PER_PAGE) {
    pages.push(activeVerdicts.slice(i, i + VERDICTS_PER_PAGE));
  }
  const totalPages = 1 + Math.max(pages.length, 1) + 1;

  return (
    <Document title={`Conformance Report ${report.reportId.slice(0, 8)}`}>
      <CoverPage report={report} totalPages={totalPages} />
      {pages.length === 0 ? (
        <VerdictsPage
          verdicts={[]}
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
            verdicts={chunk}
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

function CoverPage({
  report,
  totalPages,
}: {
  report: AssessmentResult;
  totalPages: number;
}) {
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
      <View style={styles.summaryGrid}>
        <SummaryCard label="Pass" value={report.summary.pass} colour={EMERALD} />
        <SummaryCard label="Fail" value={report.summary.fail} colour={RED} />
        <SummaryCard label="Warn" value={report.summary.warn} colour={AMBER} />
        <SummaryCard label="N/A" value={report.summary.na} colour={ZINC_700} />
      </View>

      <PageFooter pageNumber={1} totalPages={totalPages} />
    </Page>
  );
}

function VerdictsPage({
  verdicts,
  report,
  pageNumber,
  totalPages,
  isFirst,
  isLast,
}: {
  verdicts: Verdict[];
  report: AssessmentResult;
  pageNumber: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>iGrant.io · EUDI Wallet Compliance</Text>
      {isFirst && (
        <>
          <Text style={styles.h1}>Verdicts</Text>
          <Text style={styles.meta}>
            {report.verdicts.length} controls in scope ·{' '}
            {report.summary.pass + report.summary.fail + report.summary.warn} active
            checks executed
          </Text>
        </>
      )}
      <View style={styles.tableHeader}>
        <Text style={styles.colControl}>Control</Text>
        <Text style={styles.colStatus}>Status</Text>
        <Text style={styles.colNotes}>Notes</Text>
      </View>
      {verdicts.length === 0 ? (
        <Text style={{ fontSize: 10, color: ZINC_500, marginTop: 8 }}>
          No active verdicts to report. Either no checks were registered for the
          chosen scope, or every applicable control returned N/A because the
          required evidence was not supplied.
        </Text>
      ) : (
        verdicts.map((v) => (
          <View key={v.controlId} style={styles.tableRow} wrap={false}>
            <Text style={styles.colControl}>{v.controlId}</Text>
            <Text style={[styles.colStatus, { color: STATUS_COLOUR[v.status] }]}>
              {v.status.toUpperCase()}
            </Text>
            <Text style={styles.colNotes}>{v.notes}</Text>
          </View>
        ))
      )}
      {isLast && (
        <Text style={styles.meta}>
          {
            'Verdicts that returned N/A with the standard "No check implemented yet" note are omitted; the engine ships fewer than the catalogue total.'
          }
        </Text>
      )}
      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </Page>
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
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.brand}>iGrant.io · EUDI Wallet Compliance</Text>
      <Text style={styles.h1}>Gap analysis</Text>
      <Text style={{ fontSize: 10, marginBottom: 18 }}>
        The gap analysis surfaces tier transitions: which Ordinary EAA controls
        a credential would still need to clear to qualify as QEAA or PuB-EAA.
        The engine ships an empty stub today; tier-aware verdicts already run,
        and a future release will roll those into a structured gap report here.
      </Text>

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
          <Text style={styles.ctaEmail}>compliance@igrant.io</Text>.
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
