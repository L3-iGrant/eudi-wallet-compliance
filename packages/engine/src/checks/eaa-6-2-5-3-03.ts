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

const CONTROL_ID = 'EAA-6.2.5.3-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.5.3-03: attribute subject identifiers shall be associated to
 * their corresponding attributes per clause 6.3. Structural conformance
 * is enforced by the §6.3 SubAttr rules; this entry is a pointer.
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
    status: 'na',
    evidenceRef: EVIDENCE_REF,
    notes: 'Association rule; structural conformance is covered by §6.3-02 to §6.3-04.',
  };
}

export const controlId = CONTROL_ID;
