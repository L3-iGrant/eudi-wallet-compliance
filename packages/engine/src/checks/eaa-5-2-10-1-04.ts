import type { ParsedEvidence } from '@iwc/shared';
import { normaliseStatus } from './_status';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.10.1-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.10.1-04: When the status component is present, the status JSON
 * Object must have a 'type' member that is a JSON string. When status is
 * absent, the rule is N/A.
 *
 * Tolerance: tokens that carry the status component using the IETF
 * Token Status List nested envelope (`status.status_list.{idx, uri}`)
 * are accepted as conformant. The IETF draft does not define a `type`
 * member; treating its absence as a hard fail would force every IETF-
 * shaped token to fail this check.
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
      notes: 'status component is present but is not a JSON object. Expected the ETSI flat shape `{ status: { type, purpose, index, uri } }` or the IETF nested envelope `{ status: { status_list: { idx, uri } } }`.',
    };
  }
  if (ns.shape === 'ietf-nested') {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        'status uses the IETF Token Status List nested envelope (status.status_list); ' +
        'the IETF draft does not define a type member, so its absence is accepted.',
    };
  }
  if (!('type' in (ns.raw ?? {}))) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status JSON Object is missing the type member (e.g. "TokenStatusList"). The ETSI flat shape requires status.type alongside purpose/index/uri. If you intended the IETF nested envelope, drop the flat keys and use `status.status_list.{idx, uri}` instead.',
    };
  }
  if (typeof ns.type !== 'string' || ns.type.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.type is present but is not a non-empty JSON string. Expected a recognised value such as "TokenStatusList".',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `status.type member present: "${ns.type}".`,
  };
}

export const controlId = CONTROL_ID;
