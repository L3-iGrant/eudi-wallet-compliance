import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.7.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.1-01: A SD-JWT VC EAA shall include the nbf claim, an integer
 * NumericDate per IETF RFC 7519.
 */
export async function check(
  evidence: ParsedEvidence,
  _scope: AssessmentScope,
  _extras: CheckExtras,
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
  const nbf = payload['nbf'];
  if (typeof nbf !== 'number' || !Number.isInteger(nbf) || nbf < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'nbf claim missing or not a non-negative integer NumericDate.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `nbf claim present: ${nbf}`,
  };
}

export const controlId = CONTROL_ID;
