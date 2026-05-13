import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.4.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.4.1-01: When the `issuing_authority` claim is present, it
 * must be a JSON String containing the name of the EAA issuer (per
 * CIR (EU) 2024/2977 Annex I, Table 5).
 *
 * The catalogue declares this rule at `may` level so absence is N/A,
 * not fail. This check fires only when the claim is present and
 * verifies it's a non-empty string.
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
  if (!('issuing_authority' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'issuing_authority claim absent.',
    };
  }
  const value = payload['issuing_authority'];
  if (typeof value !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `issuing_authority is ${describe(value)}, not a JSON string. Per CIR (EU) 2024/2977 Annex I Table 5, issuing_authority must be a non-empty JSON string carrying the name of the EAA issuer (e.g. "Belgian Federal Public Service").`,
    };
  }
  if (value.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'issuing_authority is an empty string. Expected a non-empty JSON string carrying the name of the EAA issuer (e.g. "Belgian Federal Public Service"). If the credential is issued without an explicit authority, omit the claim entirely.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `issuing_authority is a non-empty JSON string ("${value.slice(0, 80)}").`,
  };
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
