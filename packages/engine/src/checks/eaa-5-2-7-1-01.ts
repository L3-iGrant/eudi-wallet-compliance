import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.7.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.1-01: A SD-JWT VC EAA shall include the nbf claim, an integer
 * NumericDate per IETF RFC 7519.
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
