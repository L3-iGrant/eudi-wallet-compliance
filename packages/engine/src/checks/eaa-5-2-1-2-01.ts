import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.1.2-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.1.2-01: A SD-JWT VC EAA shall include the vct claim.
 */
export function check(evidence: Evidence): Verdict {
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
  const vct = payload['vct'];
  if (typeof vct !== 'string' || vct.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'Payload is missing the vct claim, or the vct claim is not a non-empty string.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `vct claim present: ${vct}`,
  };
}

export const controlId = CONTROL_ID;
