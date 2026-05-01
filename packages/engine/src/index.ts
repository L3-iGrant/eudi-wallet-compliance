import type { Control } from '@iwc/controls';
import type {
  AssessmentResult,
  AssessmentScope,
  AssessmentSummary,
  Evidence,
  GapAnalysis,
  Verdict,
} from './types';
import { getCheck } from './registry';
import { filterControlsForScope } from './scope';

// Side-effect import: registers the built-in conformance checks into the
// shared registry as soon as anything imports @iwc/engine.
import './checks';

export interface RunAssessmentOptions {
  /**
   * Tenant identifier the assessment is attributed to. Defaults to
   * 'public-default' for the free Self-Assessment runner. Required by
   * the Workspace SaaS roadmap (Decision 2.2) so every assessment is
   * traceable to an owning tenant; not enforced anywhere in v0.
   */
  tenantId?: string;
}

const DEFAULT_TENANT_ID = 'public-default';

function summarise(verdicts: Verdict[]): AssessmentSummary {
  const summary: AssessmentSummary = { pass: 0, fail: 0, warn: 0, na: 0 };
  for (const v of verdicts) {
    summary[v.status] += 1;
  }
  return summary;
}

function emptyGapAnalysis(): GapAnalysis {
  return {
    canBeQeaa: false,
    missingForQeaa: [],
    canBePubEaa: false,
    missingForPubEaa: [],
  };
}

function listEvidenceRefs(evidence: Evidence): string[] {
  return Object.entries(evidence)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key]) => key);
}

export async function runAssessment(
  controls: Control[],
  evidence: Evidence,
  scope: AssessmentScope,
  options?: RunAssessmentOptions,
): Promise<AssessmentResult> {
  const tenantId = options?.tenantId ?? DEFAULT_TENANT_ID;

  const inScope = filterControlsForScope(controls, scope);

  const verdicts: Verdict[] = inScope.map((c) => {
    const check = getCheck(c.id);
    if (!check) {
      return {
        controlId: c.id,
        status: 'na',
        evidenceRef: '',
        notes: 'No check implemented yet',
      };
    }
    return check(evidence, scope);
  });

  return {
    reportId: crypto.randomUUID(),
    tenantId,
    scope,
    evidenceRefs: listEvidenceRefs(evidence),
    verdicts,
    summary: summarise(verdicts),
    gapAnalysis: emptyGapAnalysis(),
    createdAt: new Date().toISOString(),
  };
}

export * from './types';
export * from './registry';
export * from './scope';
