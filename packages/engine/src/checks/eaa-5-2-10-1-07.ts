import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.10.1-07';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.10.1-07: When the status JSON Object is present, its
 * purpose member must be a JSON String indicating the purpose of
 * the status list. Returns N/A when status is absent or has no
 * purpose member.
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
  const status = payload['status'];
  if (status === undefined || status === null) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status claim absent.',
    };
  }
  if (typeof status !== 'object' || Array.isArray(status)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status is present but not a JSON object.',
    };
  }
  const obj = status as Record<string, unknown>;
  if (!('purpose' in obj)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.purpose member absent.',
    };
  }
  const value = obj['purpose'];
  if (typeof value !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `status.purpose is ${describe(value)}, not a JSON string.`,
    };
  }
  if (value.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.purpose is an empty string.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `status.purpose is a non-empty JSON string ("${value}").`,
  };
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
