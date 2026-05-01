import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AssessmentResult, AssessmentScope, Evidence } from '@iwc/engine';

const runAssessmentMock = vi.fn();
const saveReportMock = vi.fn();
const loadAllControlsSyncMock = vi.fn(() => []);

vi.mock('@iwc/engine', () => ({
  runAssessment: runAssessmentMock,
}));

vi.mock('@iwc/controls/sync', () => ({
  loadAllControlsSync: loadAllControlsSyncMock,
}));

vi.mock('../../../lib/storage', () => ({
  reportStore: { saveReport: saveReportMock },
}));

const SCOPE: AssessmentScope = {
  module: 'eaa-conformance',
  profile: ['sd-jwt-vc'],
  role: ['issuer'],
  tier: 'ordinary',
};

const EVIDENCE: Evidence = { eaaPayload: 'header.payload.sig~' };

function makeResult(reportId: string, tenantId = 'public-default'): AssessmentResult {
  return {
    reportId,
    tenantId,
    scope: SCOPE,
    evidenceRefs: ['eaaPayload'],
    verdicts: [],
    summary: { pass: 0, fail: 0, warn: 0, na: 0 },
    gapAnalysis: {
      canBeQeaa: false,
      missingForQeaa: [],
      canBePubEaa: false,
      missingForPubEaa: [],
    },
    createdAt: '2026-05-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  runAssessmentMock.mockReset();
  saveReportMock.mockReset();
  loadAllControlsSyncMock.mockReset();
  loadAllControlsSyncMock.mockReturnValue([]);
});

describe('runAssessmentAction', () => {
  it('passes scope, evidence, and tenantId to the engine', async () => {
    runAssessmentMock.mockResolvedValueOnce(makeResult('r-1'));
    saveReportMock.mockResolvedValueOnce(undefined);
    const { runAssessmentAction } = await import('../run-assessment');

    await runAssessmentAction(SCOPE, EVIDENCE);

    expect(runAssessmentMock).toHaveBeenCalledTimes(1);
    const [controls, evidence, scope, options] = runAssessmentMock.mock.calls[0];
    expect(controls).toEqual([]);
    expect(evidence).toBe(EVIDENCE);
    expect(scope).toBe(SCOPE);
    expect(options).toEqual({ tenantId: 'public-default' });
  });

  it('persists the result to the report store under the resolved tenant', async () => {
    const result = makeResult('r-2');
    runAssessmentMock.mockResolvedValueOnce(result);
    saveReportMock.mockResolvedValueOnce(undefined);
    const { runAssessmentAction } = await import('../run-assessment');

    await runAssessmentAction(SCOPE, EVIDENCE);

    expect(saveReportMock).toHaveBeenCalledTimes(1);
    expect(saveReportMock).toHaveBeenCalledWith('public-default', null, result);
  });

  it('returns the reportId so the caller can navigate to the report', async () => {
    runAssessmentMock.mockResolvedValueOnce(makeResult('r-3'));
    saveReportMock.mockResolvedValueOnce(undefined);
    const { runAssessmentAction } = await import('../run-assessment');

    const out = await runAssessmentAction(SCOPE, EVIDENCE);

    expect(out).toEqual({ reportId: 'r-3' });
  });
});
