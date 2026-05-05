import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

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
