import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.7.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.1-03: A SD-JWT VC EAA shall include the exp claim, an integer
 * NumericDate per IETF RFC 7519. Additionally, when both nbf and exp are
 * present, exp must be strictly greater than nbf (otherwise the EAA has a
 * never-valid window).
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
  const exp = payload['exp'];
  if (typeof exp !== 'number' || !Number.isInteger(exp) || exp < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'exp claim is missing or is not a non-negative integer NumericDate. RFC 7519 §2 requires exp to be a JSON number representing seconds since 1970-01-01T00:00:00Z (e.g. 1767225600). String-quoted timestamps ("1767225600"), ISO-8601 strings and floating-point/negative values are not accepted.',
    };
  }
  const nbf = payload['nbf'];
  if (typeof nbf === 'number' && Number.isInteger(nbf) && exp <= nbf) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `exp (${exp}) must be strictly greater than nbf (${nbf}); otherwise the EAA defines a validity window that closes before it opens. Either increase exp or decrease nbf so the technical validity period spans a positive interval.`,
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
