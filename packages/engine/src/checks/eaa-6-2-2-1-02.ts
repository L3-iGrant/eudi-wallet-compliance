import type { ParsedEvidence } from '@iwc/shared';
import type { CheckExtras } from '../registry';
import type { AssessmentScope, Verdict } from '../types';
import {
  MDL_DOC_TYPE,
  NS_MDL,
  NS_ISO_23220,
  NS_ETSI,
  URN_QEAA,
  URN_PUB_EAA,
  isMdl,
  primaryNamespace,
  hasElement,
  findElement,
  findElementAnyNs,
} from './_mdoc';

const CONTROL_ID = 'EAA-6.2.2.1-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.2.1-02: category data element shall implement the semantics of
 * clause 4.2.2. The category-presence and category-value checks already
 * cover the structural side (-01 / -03 / QEAA / PuB-EAA variants);
 * semantic conformance to clause 4.2.2 is deferred to a hand-curated
 * pass.
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
  const found = findElementAnyNs(evidence.parsed, 'category');
  if (found === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'category data element absent; rule applies only when category is present.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'na',
    evidenceRef: EVIDENCE_REF,
    notes:
      'Structural presence and value covered by §6.2.2.1-03 and the QEAA/PuB-EAA value rules; clause-4.2.2 semantic conformance is deferred.',
  };
}

export const controlId = CONTROL_ID;
