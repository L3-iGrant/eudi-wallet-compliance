import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.10.1-06';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.10.1-06: When the status component is present, the status JSON
 * Object shall have the purpose member.
 */
export function check(evidence: Evidence, _scope: AssessmentScope): Verdict {
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
      notes: 'status component is present but not a JSON object.',
    };
  }
  const obj = status as Record<string, unknown>;
  if (!('purpose' in obj)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status JSON Object is missing the purpose member.',
    };
  }
  const purpose = obj['purpose'];
  if (typeof purpose !== 'string' || purpose.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.purpose member is present but not a non-empty string.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `status.purpose member present: "${purpose}".`,
  };
}

export const controlId = CONTROL_ID;
