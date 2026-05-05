import type { ParsedEvidence } from '@iwc/shared';
import type { CheckExtras } from '../registry';
import type { AssessmentScope, Verdict } from '../types';
import {
  MDL_DOC_TYPE,
  NS_MDL,
  NS_ISO_23220,
  NS_ETSI,
  isMdl,
  primaryNamespace,
  hasElement,
  findElement,
  findElementAnyNs,
} from './_mdoc';
import { normaliseStatus } from './_status';
import { fetchStatusList, getStatusAt } from '@iwc/status-list';

const CONTROL_ID = 'EAA-6.2.10.2-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.10.2-01 (synthetic, runtime): mirrors the SD-JWT VC resolver
 * EAA-5.2.10.2-01. Reads status URI and index via normaliseStatus over
 * mso.status, falls through to evidence.statusListUrl for offline /
 * test override, fetches the Token Status List and looks up the index.
 */
export async function check(
  evidence: ParsedEvidence,
  _scope: AssessmentScope,
  extras: CheckExtras,
): Promise<Verdict> {
  if (evidence.kind !== 'mdoc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to mdoc evidence only.',
    };
  }
  const status = evidence.parsed.issuerAuth.mso.status;
  if (status === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: 'status-list',
      notes:
        'status component absent or not a JSON object; runtime resolver only runs when status is present.',
    };
  }
  const ns = normaliseStatus({ status });
  if (ns.shape === 'invalid' || ns.shape === 'absent') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: 'status-list',
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
      evidenceRef: 'status-list',
      notes:
        'No status URI available (neither extras.statusListUrl nor a status URI in the MSO).',
    };
  }
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: 'status-list',
      notes: 'status index is missing or not a non-negative integer; cannot resolve.',
    };
  }
  try {
    const list = await fetchStatusList(uri);
    const value = getStatusAt(list, index);
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: 'status-list',
      notes: `Status list at ${uri} resolved; index ${index} returned status value ${value} (${list.format}, ${list.bitsPerStatus}-bit).`,
    };
  } catch (err) {
    const message = (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: 'status-list',
      notes: `Status list could not be resolved at ${uri}: ${message}`,
    };
  }
}

export const controlId = CONTROL_ID;
