import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.10.1-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.10.1-05: When the status JSON Object is present, its
 * type member must be a JSON String. The spec defines
 * "TokenStatusList" as a recognised value, but does not constrain
 * the set, so this check accepts any non-empty string.
 *
 * Returns N/A when status is absent or has no type member.
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
      notes: 'status is present but not a JSON object. Expected the ETSI flat shape `{ status: { type, purpose, index, uri } }` or the IETF nested envelope `{ status: { status_list: { idx, uri } } }`.',
    };
  }
  const obj = status as Record<string, unknown>;
  if (!('type' in obj)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.type member absent.',
    };
  }
  const value = obj['type'];
  if (typeof value !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `status.type is ${describe(value)}, not a JSON string. Expected a non-empty string identifying the status mechanism (e.g. "TokenStatusList").`,
    };
  }
  if (value.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.type is an empty string. Expected a non-empty JSON string identifying the status mechanism (e.g. "TokenStatusList").',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `status.type is a non-empty JSON string ("${value}").`,
  };
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
