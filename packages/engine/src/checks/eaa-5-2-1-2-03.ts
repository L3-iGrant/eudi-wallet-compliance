import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.1.2-03';
const EVIDENCE_REF = 'eaa-payload';
const INTEGRITY_CLAIM = 'vct#integrity';

/**
 * EAA-5.2.1.2-03: A SD-JWT VC EAA shall incorporate the claim vct#integrity.
 */
export function check(evidence: Evidence, _scope: AssessmentScope): Verdict {
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
