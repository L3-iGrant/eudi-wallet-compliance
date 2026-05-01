import { parseSdJwtVc, ParseError } from '@iwc/shared';
import { fetchStatusList, getStatusAt } from '@iwc/status-list';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.10.2-01';
const EVIDENCE_REF = 'status-list';

/**
 * EAA-5.2.10.2-01 (runtime resolver): the URI in the credential's status
 * component must resolve to a parseable Token Status List, and the
 * credential's index must read out a registered status value.
 *
 * Verdicts:
 *  - na   : no payload, or status component is absent (no work to do)
 *  - fail : fetch fails, list cannot be parsed, or the index is OOB
 *  - pass : list resolved and a status value was returned (value in notes)
 *
 * Trust-list verification of the status list signature is deferred until
 * trust-list integration lands. evidence.statusListUrl, if supplied,
 * overrides the URI from the payload (useful for tests and offline runs).
 */
export async function check(
  evidence: Evidence,
  _scope: AssessmentScope,
): Promise<Verdict> {
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
  if (
    status === undefined ||
    status === null ||
    typeof status !== 'object' ||
    Array.isArray(status)
  ) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component absent; runtime resolver only runs when status is present.',
    };
  }

  const obj = status as Record<string, unknown>;
  const uri = evidence.statusListUrl ?? (typeof obj['uri'] === 'string' ? obj['uri'] : undefined);
  const index = obj['index'];

  if (!uri) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No status URI available (neither evidence.statusListUrl nor payload status.uri).',
    };
  }
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.index is missing or not a non-negative integer; cannot resolve.',
    };
  }

  try {
    const list = await fetchStatusList(uri);
    const value = getStatusAt(list, index);
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes: `Status list at ${uri} resolved; index ${index} returned status value ${value} (${list.format}, ${list.bitsPerStatus}-bit).`,
    };
  } catch (err) {
    const message = (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Status list could not be resolved at ${uri}: ${message}`,
    };
  }
}

export const controlId = CONTROL_ID;
