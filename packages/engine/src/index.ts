import type { Control } from '@iwc/controls';
import { ParseError, parseEvidence, type ParsedEvidence } from '@iwc/shared';
import type {
  AssessmentResult,
  AssessmentScope,
  AssessmentSummary,
  Evidence,
  GapAnalysis,
  Verdict,
} from './types';
import { getCheck, type CheckExtras } from './registry';
import { filterControlsForScope } from './scope';
import { computeAdditionallyRequired } from './gap-analysis';

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

function listEvidenceRefs(evidence: Evidence): string[] {
  return Object.entries(evidence)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key]) => key);
}

/**
 * One of three "no parsed payload available" outcomes that runAssessment
 * fans out to every check when the EAA payload is missing or could not
 * be parsed. Each check still gets a verdict (na or fail) so the report
 * has a complete row per in-scope control.
 */
type PayloadOutcome =
  | { state: 'parsed'; parsed: ParsedEvidence }
  | { state: 'absent' }
  | { state: 'parse-failed'; message: string };

function payloadOutcomeVerdict(
  controlId: string,
  outcome: Exclude<PayloadOutcome, { state: 'parsed' }>,
): Verdict {
  if (outcome.state === 'absent') {
    return {
      controlId,
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  return {
    controlId,
    status: 'fail',
    evidenceRef: 'eaa-payload',
    notes: `EAA payload could not be parsed: ${outcome.message}`,
  };
}

/**
 * Run every applicable control's check against the parsed evidence,
 * scope and side-channel extras, returning the verdict list. Pure
 * helper, used both for the main assessment and for tier-comparison
 * passes inside computeGapAnalysis.
 */
async function runVerdicts(
  controls: Control[],
  payload: PayloadOutcome,
  extras: CheckExtras,
  scope: AssessmentScope,
): Promise<Verdict[]> {
  const inScope = filterControlsForScope(controls, scope);
  return Promise.all(
    inScope.map(async (c): Promise<Verdict> => {
      const check = getCheck(c.id);
      if (!check) {
        return {
          controlId: c.id,
          status: 'na',
          evidenceRef: '',
          notes: 'No check implemented yet',
        };
      }
      if (payload.state !== 'parsed') {
        return payloadOutcomeVerdict(c.id, payload);
      }
      return check(payload.parsed, scope, extras);
    }),
  );
}

function preparePayload(evidence: Evidence): PayloadOutcome {
  if (
    evidence.eaaPayload === undefined ||
    evidence.eaaPayload === null ||
    evidence.eaaPayload.trim().length === 0
  ) {
    return { state: 'absent' };
  }
  try {
    return { state: 'parsed', parsed: parseEvidence(evidence.eaaPayload) };
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return { state: 'parse-failed', message };
  }
}

function evidenceExtras(evidence: Evidence): CheckExtras {
  return {
    issuerCert: evidence.issuerCert,
    statusListUrl: evidence.statusListUrl,
    typeMetadata: evidence.typeMetadata,
  };
}

/**
 * Re-runs the same evidence at QEAA and PuB-EAA tiers (in parallel)
 * and reports which controls fail at each. Captures behaviour-aware
 * tier differences (e.g. the shortLived/status mutex which flips
 * between Ordinary and QEAA) that a static catalogue filter cannot.
 */
async function computeFailingAtHigherTiers(
  controls: Control[],
  payload: PayloadOutcome,
  extras: CheckExtras,
  scope: AssessmentScope,
): Promise<{
  canBeQeaa: boolean;
  missingForQeaa: string[];
  canBePubEaa: boolean;
  missingForPubEaa: string[];
}> {
  const [qeaaVerdicts, pubEaaVerdicts] = await Promise.all([
    runVerdicts(controls, payload, extras, { ...scope, tier: 'qeaa' }),
    runVerdicts(controls, payload, extras, { ...scope, tier: 'pub-eaa' }),
  ]);
  const failingForQeaa = qeaaVerdicts
    .filter((v) => v.status === 'fail')
    .map((v) => v.controlId);
  const failingForPubEaa = pubEaaVerdicts
    .filter((v) => v.status === 'fail')
    .map((v) => v.controlId);
  return {
    canBeQeaa: failingForQeaa.length === 0,
    missingForQeaa: failingForQeaa,
    canBePubEaa: failingForPubEaa.length === 0,
    missingForPubEaa: failingForPubEaa,
  };
}

export async function runAssessment(
  controls: Control[],
  evidence: Evidence,
  scope: AssessmentScope,
  options?: RunAssessmentOptions,
): Promise<AssessmentResult> {
  const tenantId = options?.tenantId ?? DEFAULT_TENANT_ID;

  // Parse the EAA payload once; checks operate on the parsed shape and
  // never re-parse. If parsing fails or the payload is absent, every
  // in-scope check still gets a verdict (na or fail) via runVerdicts.
  const payload = preparePayload(evidence);
  const extras = evidenceExtras(evidence);

  const [verdicts, behaviourGaps] = await Promise.all([
    runVerdicts(controls, payload, extras, scope),
    computeFailingAtHigherTiers(controls, payload, extras, scope),
  ]);

  // Static catalogue delta: controls that become required at a higher
  // tier and are not yet passing in the main verdicts.
  const additionallyRequired = computeAdditionallyRequired(
    controls,
    verdicts,
    scope.tier,
  );

  const gapAnalysis: GapAnalysis = {
    ...behaviourGaps,
    ...additionallyRequired,
  };

  return {
    reportId: crypto.randomUUID(),
    tenantId,
    scope,
    evidenceRefs: listEvidenceRefs(evidence),
    verdicts,
    summary: summarise(verdicts),
    gapAnalysis,
    createdAt: new Date().toISOString(),
  };
}

export * from './types';
export * from './registry';
export * from './scope';
