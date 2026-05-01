import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.7.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.1-03: A SD-JWT VC EAA shall include the exp claim, an integer
 * NumericDate per IETF RFC 7519. Additionally, when both nbf and exp are
 * present, exp must be strictly greater than nbf (otherwise the EAA has a
 * never-valid window).
 */
export async function check(evidence: Evidence, _scope: AssessmentScope): Promise<Verdict> {
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
  const exp = payload['exp'];
  if (typeof exp !== 'number' || !Number.isInteger(exp) || exp < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'exp claim missing or not a non-negative integer NumericDate.',
    };
  }
  const nbf = payload['nbf'];
  if (typeof nbf === 'number' && Number.isInteger(nbf) && exp <= nbf) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `exp (${exp}) must be strictly greater than nbf (${nbf}).`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `exp claim present: ${exp}`,
  };
}

export const controlId = CONTROL_ID;
