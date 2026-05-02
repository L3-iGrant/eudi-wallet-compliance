import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.7.2-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.2-05: A SD-JWT VC EAA either shall contain both the
 * adm_nbf and the adm_exp claims, or shall not contain any of them.
 *
 * Verdicts:
 *  - na   : no payload, or neither claim present (rule satisfied vacuously
 *           but nothing to evaluate; surfaced as "rule does not apply").
 *  - pass : both claims present.
 *  - fail : exactly one claim present (the violation).
 */
export async function check(
  evidence: Evidence,
  _scope: AssessmentScope,
): Promise<Verdict> {
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
  const hasNbf = 'adm_nbf' in payload;
  const hasExp = 'adm_exp' in payload;
  if (!hasNbf && !hasExp) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Neither adm_nbf nor adm_exp present; pairing rule not exercised.',
    };
  }
  if (hasNbf && hasExp) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes: 'adm_nbf and adm_exp both present.',
    };
  }
  const missing = hasNbf ? 'adm_exp' : 'adm_nbf';
  return {
    controlId: CONTROL_ID,
    status: 'fail',
    evidenceRef: EVIDENCE_REF,
    notes: `Only one of the pair present; ${missing} is missing. They must appear together or not at all.`,
  };
}

export const controlId = CONTROL_ID;
