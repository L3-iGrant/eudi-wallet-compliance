import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.5.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.5.1-01: When the `sub` claim is present, it must be a JSON
 * String per IETF RFC 7519 clause 4.1.2 (StringOrURI). Returns N/A
 * when sub is absent. sub is optional in an SD-JWT VC EAA per
 * EAA-5.2.5.1-02.
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
  if (!('sub' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'sub claim absent.',
    };
  }
  const value = payload['sub'];
  if (typeof value !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `sub is ${describe(value)}, not a JSON string.`,
    };
  }
  if (value.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'sub is an empty string.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'sub is a non-empty JSON string.',
  };
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
