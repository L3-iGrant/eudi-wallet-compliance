import type { ParsedEvidence } from '@iwc/shared';
import { normaliseStatus } from './_status';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.10.1-06';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.10.1-06: When the status component is present, the status JSON
 * Object shall have the purpose member.
 *
 * Tolerance: IETF Token Status List nested envelope is accepted. The
 * IETF draft does not define a `purpose` member.
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
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        'status uses the IETF Token Status List nested envelope (status.status_list); ' +
        'the IETF draft does not define a purpose member, so its absence is accepted.',
    };
  }
  if (!('purpose' in (ns.raw ?? {}))) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status JSON Object is missing the purpose member (e.g. "revocation" or "suspension"). The ETSI flat shape requires status.purpose alongside type/index/uri. If you intended the IETF nested envelope, drop the flat keys and use `status.status_list.{idx, uri}` instead.',
    };
  }
  if (typeof ns.purpose !== 'string' || ns.purpose.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.purpose is present but is not a non-empty JSON string. Expected a value such as "revocation" or "suspension" identifying what the status reflects.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `status.purpose member present: "${ns.purpose}".`,
  };
}

export const controlId = CONTROL_ID;
