import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.7.1-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.1-04: The `exp` claim implements the semantics of the
 * second time instant of the SD-JWT VC EAA technical validity period
 * (the expiration). Structurally a NumericDate per RFC 7519.
 *
 * Sister rule EAA-5.2.7.1-03 enforces presence and ordering against
 * nbf; this rule attributes the structural verification to the
 * per-control id so the audit report has one verdict per entry.
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
  if (!('exp' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'exp claim absent.',
    };
  }
  const value = payload['exp'];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `exp is ${JSON.stringify(value)}, not a non-negative integer NumericDate per RFC 7519 §2. Expected a JSON number of seconds since 1970-01-01T00:00:00Z (e.g. 1767225600); string-quoted timestamps and floating-point/negative values are rejected.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `exp is a valid NumericDate (${value}), marking the end of the technical validity period.`,
  };
}

export const controlId = CONTROL_ID;
