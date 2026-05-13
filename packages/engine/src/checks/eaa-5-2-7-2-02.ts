import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.7.2-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.2-02: When adm_nbf is present, it must implement the
 * "first time instant of the administrative validity period"
 * semantics. Structurally that means it must be a NumericDate per
 * RFC 7519 (a non-negative integer in seconds since the epoch).
 *
 * Returns N/A when adm_nbf is absent. EAA-5.2.7.2-05 separately
 * enforces that adm_nbf and adm_exp must appear together; this
 * check only verifies the value when present.
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
  if (!('adm_nbf' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'adm_nbf claim absent.',
    };
  }
  const value = payload['adm_nbf'];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `adm_nbf is ${JSON.stringify(value)}, not a non-negative integer NumericDate per RFC 7519 §2. Expected a JSON number of seconds since 1970-01-01T00:00:00Z (e.g. 1735689600); string-quoted timestamps and floating-point/negative values are rejected.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `adm_nbf is a valid NumericDate (${value}).`,
  };
}

export const controlId = CONTROL_ID;
