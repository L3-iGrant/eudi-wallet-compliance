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

const CONTROL_ID = 'EAA-6.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.1-03: if the EAA is NOT a mDL, it shall contain data elements
 * from ISO/IEC 23220-2 §6.3 within the namespace "org.iso.23220.1".
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
      notes: 'Rule applies only when docType is not the mDL docType.',
    };
  }
  if (!evidence.parsed.nameSpaces[NS_ISO_23220]) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Non-mDL credential is missing the "${NS_ISO_23220}" namespace.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `Non-mDL credential carries the "${NS_ISO_23220}" namespace.`,
  };
}

export const controlId = CONTROL_ID;
