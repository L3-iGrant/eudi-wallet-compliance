import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.10.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.10.1-03: When the status component is present, it shall be a
 * JSON Object. Absent status is N/A (status itself is optional).
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
      notes: 'status component absent; rule applies only when status is present.',
    };
  }
  if (typeof status !== 'object' || Array.isArray(status)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component is present but is not a JSON object. Expected either the ETSI flat shape `{ "status": { "type": "...", "purpose": "...", "index": N, "uri": "https://..." } }` or the IETF Token Status List nested envelope `{ "status": { "status_list": { "idx": N, "uri": "https://..." } } }`.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'status component is a JSON object.',
  };
}

export const controlId = CONTROL_ID;
