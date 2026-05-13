import type { ParsedEvidence } from '@iwc/shared';
import { normaliseStatus } from './_status';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.10.1-08';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.10.1-08: When the status component is present, the status JSON
 * Object shall have the index member.
 *
 * Tolerance: tokens carrying the IETF Token Status List nested
 * envelope (`status.status_list.idx`) satisfy this rule. The IETF
 * draft uses `idx` instead of `index`; both name the same concept.
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
  const ns = normaliseStatus(payload);
  if (ns.shape === 'absent') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component absent; rule applies only when status is present.',
    };
  }
  if (ns.shape === 'invalid') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component is present but not a JSON object. Expected the ETSI flat shape `{ status: { type, purpose, index, uri } }` or the IETF nested envelope `{ status: { status_list: { idx, uri } } }`.',
    };
  }
  if (ns.shape === 'ietf-nested') {
    if (ns.index === undefined) {
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes:
          'status uses the IETF nested envelope but status.status_list.idx is missing. Expected `{ status: { status_list: { idx: <non-negative integer>, uri: "https://..." } } }` — the idx names the credential\'s row in the Token Status List.',
      };
    }
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        'status.status_list.idx present (IETF Token Status List nested envelope; accepted in lieu of status.index).',
    };
  }
  if (!('index' in (ns.raw ?? {}))) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status JSON Object is missing the index member. The ETSI flat shape requires `status.index` as a non-negative integer naming this credential\'s row in the status list. If you intended the IETF nested envelope, use `status.status_list.idx` instead.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'status.index member present.',
  };
}

export const controlId = CONTROL_ID;
