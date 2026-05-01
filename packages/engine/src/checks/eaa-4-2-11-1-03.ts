import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-4.2.11.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-4.2.11.1-03: An EAA that incorporates the EAA short-lived component
 * shall not also incorporate the EAA status service. Cross-cutting; tier-
 * sensitive: QEAA and PuB-EAA require exactly one revocation strategy
 * (status service or shortLived). Ordinary EAA may have neither.
 */
export async function check(evidence: Evidence, scope: AssessmentScope): Promise<Verdict> {
  if (!evidence.eaaPayload) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  let payload: Record<string, unknown>;
  try {
    ({ payload } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }

  const hasShortLived = payload['shortLived'] !== undefined;
  const hasStatus = payload['status'] !== undefined;

  if (hasShortLived && hasStatus) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes:
        'Both shortLived and status are present. The EAA must use exactly one revocation strategy.',
    };
  }

  if (!hasShortLived && !hasStatus) {
    if (scope.tier === 'qeaa' || scope.tier === 'pub-eaa') {
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes: `Neither shortLived nor status is present, but tier "${scope.tier}" requires one of the two.`,
      };
    }
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        'Neither shortLived nor status is present. Both are optional for the Ordinary tier.',
    };
  }

  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `Exactly one revocation strategy is present (${hasShortLived ? 'shortLived' : 'status'}).`,
  };
}

export const controlId = CONTROL_ID;
