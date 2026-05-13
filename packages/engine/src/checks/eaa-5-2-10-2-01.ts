import type { ParsedEvidence } from '@iwc/shared';
import { fetchStatusList, getStatusAt } from '@iwc/status-list';
import { normaliseStatus } from './_status';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

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
 * Tolerance: the resolver reads index/uri from either the ETSI flat
 * shape (`status.{index, uri}`) or the IETF Token Status List nested
 * envelope (`status.status_list.{idx, uri}`). extras.statusListUrl,
 * if supplied, overrides the URI from the payload (useful for tests
 * and offline runs).
 *
 * Trust-list verification of the status list signature is deferred
 * until trust-list integration lands.
 */
export async function check(
  evidence: ParsedEvidence,
  _scope: AssessmentScope,
  extras: CheckExtras,
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
  if (ns.shape === 'absent' || ns.shape === 'invalid') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes:
        'status component absent or not a JSON object; runtime resolver only runs when status is present.',
    };
  }

  const uri = extras.statusListUrl ?? (typeof ns.uri === 'string' ? ns.uri : undefined);
  const index = ns.index;

  if (!uri) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes:
        'No status URI available (neither extras.statusListUrl nor a status URI in the payload).',
    };
  }
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'Cannot resolve the status list: the index is missing or is not a non-negative integer. Expected `status.index` (ETSI flat) or `status.status_list.idx` (IETF nested) as a JSON integer >= 0, naming this credential\'s row in the list.',
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
