import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-4.2.11.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-4.2.11.1-03: An EAA that incorporates the EAA short-lived component
 * shall not also incorporate the EAA status service. Cross-cutting; tier-
 * sensitive: QEAA and PuB-EAA require exactly one revocation strategy
 * (status service or shortLived). Ordinary EAA may have neither.
 */
export async function check(
  evidence: ParsedEvidence,
  scope: AssessmentScope,
  extras: CheckExtras,
): Promise<Verdict> {
  if (evidence.kind !== 'sd-jwt-vc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to SD-JWT VC evidence only.',
    };
  }
  const { payload } = evidence.parsed;

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
