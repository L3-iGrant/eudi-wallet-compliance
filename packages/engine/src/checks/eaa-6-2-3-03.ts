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

const CONTROL_ID = 'EAA-6.2.3-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.3-03: if the EAA is a mDL, document_number shall be as
 * specified in Table 5 of ISO/IEC 18013-5 §7.2.1, in the mDL namespace.
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
  if (!isMdl(evidence.parsed)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only to mDL credentials.',
    };
  }
  if (!hasElement(evidence.parsed, NS_MDL, 'document_number')) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `mDL is missing document_number from the "${NS_MDL}" namespace. Per Table 5 of ISO/IEC 18013-5 §7.2.1, an mDL must expose document_number (the official document identifier issued by the issuing authority) inside this namespace. Add an IssuerSignedItem with elementIdentifier="document_number" in "${NS_MDL}".`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `mDL carries document_number in "${NS_MDL}".`,
  };
}

export const controlId = CONTROL_ID;
