import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

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
      notes: `adm_nbf is ${JSON.stringify(value)}, not a non-negative integer NumericDate.`,
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
