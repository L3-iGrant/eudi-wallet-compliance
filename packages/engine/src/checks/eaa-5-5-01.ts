import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.5-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.5-01: A SD-JWT VC EAA should incorporate the cnf claim for
 * holder key binding (see EAA-5.5-02 for the cnf shape rules).
 *
 * The spec uses "should", not "shall", so absence is a warn, not a fail.
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
  const cnf = payload['cnf'];
  if (cnf === undefined || cnf === null) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf claim absent. Recommended for key-bound EAAs.',
    };
  }
  if (typeof cnf !== 'object' || Array.isArray(cnf)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf claim is present but not a JSON object.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'cnf claim present.',
  };
}

export const controlId = CONTROL_ID;
