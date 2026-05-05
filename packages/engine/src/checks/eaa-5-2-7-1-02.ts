import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.7.1-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.1-02: The `nbf` claim implements the semantics of the
 * first time instant of the SD-JWT VC EAA technical validity period.
 * Structurally that means a NumericDate per RFC 7519 (non-negative
 * integer, seconds since the Unix epoch).
 *
 * Sister rule EAA-5.2.7.1-01 enforces presence; this rule attributes
 * the structural verification to the per-control id so an audit
 * report has one verdict per spec entry.
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
  if (!('nbf' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'nbf claim absent.',
    };
  }
  const value = payload['nbf'];
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `nbf is ${JSON.stringify(value)}, not a non-negative integer NumericDate.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `nbf is a valid NumericDate (${value}), marking the start of the technical validity period.`,
  };
}

export const controlId = CONTROL_ID;
