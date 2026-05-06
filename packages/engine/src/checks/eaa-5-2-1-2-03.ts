import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.1.2-03';
const EVIDENCE_REF = 'eaa-payload';
const INTEGRITY_CLAIM = 'vct#integrity';

/**
 * EAA-5.2.1.2-03: A SD-JWT VC EAA shall incorporate the claim vct#integrity.
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
  const integrity = payload[INTEGRITY_CLAIM];
  if (typeof integrity !== 'string' || integrity.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Payload is missing the ${INTEGRITY_CLAIM} claim, or the value is not a non-empty string.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `${INTEGRITY_CLAIM} claim present.`,
  };
}

export const controlId = CONTROL_ID;
