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

const CONTROL_ID = 'EAA-6.2.3-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.3-04: if the EAA is NOT a mDL, document_number shall be as
 * specified in clause 6.3 of ISO/IEC 23220-2, in the 23220-2 namespace.
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
  if (!hasElement(evidence.parsed, NS_ISO_23220, 'document_number')) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Non-mDL credential is missing document_number from the "${NS_ISO_23220}" namespace. Per clause 6.3 of ISO/IEC 23220-2, non-mDL mdoc credentials must expose document_number in this namespace. Add an IssuerSignedItem with elementIdentifier="document_number" in "${NS_ISO_23220}" carrying the credential's reference number/identifier.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `Non-mDL credential carries document_number in "${NS_ISO_23220}".`,
  };
}

export const controlId = CONTROL_ID;
