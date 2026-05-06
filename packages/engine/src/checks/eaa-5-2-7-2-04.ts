import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.7.2-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.2-04: When adm_exp is present, it must implement the
 * "second time instant of the administrative validity period"
 * (the expiration). Structurally that means a NumericDate per
 * RFC 7519. Pairing with adm_nbf is enforced by EAA-5.2.7.2-05;
 * the chronological ordering (exp > nbf) is enforced by
 * EAA-5.2.7.2-06.
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
  if (!('adm_exp' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'adm_exp claim absent.',
    };
  }
  const value = payload['adm_exp'];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `adm_exp is ${JSON.stringify(value)}, not a non-negative integer NumericDate.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `adm_exp is a valid NumericDate (${value}).`,
  };
}

export const controlId = CONTROL_ID;
