import { parseSdJwtVc, ParseError } from '@iwc/shared';
import { normaliseStatus } from './_status';
import type { AssessmentScope, Evidence, Verdict } from '../types';

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
export async function check(evidence: Evidence, _scope: AssessmentScope): Promise<Verdict> {
  if (!evidence.eaaPayload) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  let payload: Record<string, unknown>;
  try {
    ({ payload } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }
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
      notes: 'status component is present but not a JSON object.',
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
      notes: 'status JSON Object is missing the type member.',
    };
  }
  if (typeof ns.type !== 'string' || ns.type.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.type member is present but not a non-empty string.',
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
