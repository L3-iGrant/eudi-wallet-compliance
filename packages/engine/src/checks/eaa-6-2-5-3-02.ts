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

const CONTROL_ID = 'EAA-6.2.5.3-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.5.3-02: for each attribute subject the mdoc EAA may include
 * either the attribute subject identifier or the attribute subject
 * pseudonym. Permissive; structural conformance is checked by §6.3-03
 * (SubAttr.subId or .subAka).
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
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'Permissive; SubAttr presence-of-one rule lives at EAA-6.3-03.',
  };
}

export const controlId = CONTROL_ID;
