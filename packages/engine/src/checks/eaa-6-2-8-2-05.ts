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

const CONTROL_ID = 'EAA-6.2.8.2-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.8.2-05: oneTime false or absent removes the constraint. Mirror
 * of -04; passes when oneTime is absent or set to false.
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
  const oneTime = findElement(evidence.parsed, NS_ETSI, 'oneTime');
  if (oneTime === undefined || oneTime === false) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        oneTime === undefined
          ? 'oneTime absent; constraint does not apply.'
          : 'oneTime is false; constraint does not apply.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'na',
    evidenceRef: EVIDENCE_REF,
    notes: 'oneTime is true; -04 governs.',
  };
}

export const controlId = CONTROL_ID;
