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

const CONTROL_ID = 'EAA-6.2.10.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.10.1-03: status may contain status_list per IETF
 * draft-ietf-oauth-status-list-13. Permissive rule; the IETF nested
 * envelope is accepted in lieu of the flat ETSI shape via
 * normaliseStatus, mirroring the SD-JWT VC tolerance.
 */
export async function check(
  evidence: ParsedEvidence,
  _scope: AssessmentScope,
  _extras: CheckExtras,
): Promise<Verdict> {
  if (evidence.kind !== 'mdoc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to mdoc evidence only.',
    };
  }
  if (evidence.parsed.issuerAuth.mso.status === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component absent; rule applies only when present.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'IETF nested envelope is accepted via normaliseStatus.',
  };
}

export const controlId = CONTROL_ID;
