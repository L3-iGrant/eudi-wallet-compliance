import type { ParsedEvidence } from '@iwc/shared';
import { normaliseStatus } from './_status';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.10.1-10';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.10.1-10: When the status component is present, the status JSON
 * Object shall have the uri member.
 *
 * Tolerance: IETF Token Status List nested envelope
 * (`status.status_list.uri`) satisfies this rule.
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
    if (typeof ns.uri !== 'string' || ns.uri.length === 0) {
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes:
          'status uses the IETF nested envelope but status.status_list.uri is missing or not a non-empty string. Expected an absolute http(s) URL pointing to the Token Status List endpoint, e.g. `{ status: { status_list: { idx: 42, uri: "https://issuer.example/status-lists/eaa-1" } } }`.',
      };
    }
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        'status.status_list.uri present (IETF Token Status List nested envelope; accepted in lieu of status.uri).',
    };
  }
  if (!('uri' in (ns.raw ?? {}))) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status JSON Object is missing the uri member. The ETSI flat shape requires `status.uri` as an absolute http(s) URL pointing to the status-list endpoint. If you intended the IETF nested envelope, use `status.status_list.uri` instead.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'status.uri member present.',
  };
}

export const controlId = CONTROL_ID;
