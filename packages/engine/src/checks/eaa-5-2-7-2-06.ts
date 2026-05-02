import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.7.2-06';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.2-06: When present, adm_nbf and adm_exp must be NumericDate
 * (a JSON number representing seconds since the Unix epoch, integer or
 * decimal). The toolkit accepts non-negative integers; fractional values
 * are unusual in practice and warned rather than failed.
 *
 * If both are present and well-formed, also checks that adm_exp is
 * later than adm_nbf (administrative validity window is forward-going).
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
  const nbf = payload['adm_nbf'];
  const exp = payload['adm_exp'];
  if (nbf === undefined && exp === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Neither adm_nbf nor adm_exp present.',
    };
  }
  const failures: string[] = [];
  if (nbf !== undefined && !isNumericDate(nbf)) {
    failures.push('adm_nbf is not a non-negative NumericDate (integer)');
  }
  if (exp !== undefined && !isNumericDate(exp)) {
    failures.push('adm_exp is not a non-negative NumericDate (integer)');
  }
  if (failures.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: failures.join('; '),
    };
  }
  if (typeof nbf === 'number' && typeof exp === 'number' && exp <= nbf) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `adm_exp (${exp}) is not later than adm_nbf (${nbf}); administrative validity must be forward-going.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `Administrative validity claims are NumericDate${typeof nbf === 'number' && typeof exp === 'number' ? ` and adm_exp > adm_nbf` : ''}.`,
  };
}

function isNumericDate(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}

export const controlId = CONTROL_ID;
