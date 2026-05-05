import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.6-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.6-01: When the `iat` claim is present, it must be a
 * NumericDate per IETF RFC 7519 (a non-negative integer representing
 * seconds since the Unix epoch). The catalogue separately allows iat
 * to be absent (EAA-5.2.6-02 is a `may` rule), so absence is N/A.
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
  if (!('iat' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'iat claim absent.',
    };
  }
  const value = payload['iat'];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `iat is ${JSON.stringify(value)}, not a non-negative integer NumericDate.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `iat is a valid NumericDate (${value}).`,
  };
}

export const controlId = CONTROL_ID;
