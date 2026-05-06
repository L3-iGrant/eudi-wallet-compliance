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

const CONTROL_ID = 'EAA-6.2.4.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.4.1-03: if NOT mDL, the EAA shall include
 * issuing_authority_unicode in the 23220-2 namespace.
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
  if (isMdl(evidence.parsed)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only to non-mDL credentials.',
    };
  }
  if (!hasElement(evidence.parsed, NS_ISO_23220, 'issuing_authority_unicode')) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Non-mDL is missing issuing_authority_unicode from "${NS_ISO_23220}".`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'Non-mDL carries issuing_authority_unicode.',
  };
}

export const controlId = CONTROL_ID;
