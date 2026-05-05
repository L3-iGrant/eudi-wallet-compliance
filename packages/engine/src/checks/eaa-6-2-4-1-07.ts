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

const CONTROL_ID = 'EAA-6.2.4.1-07';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.4.1-07: if NOT mDL, issuing_country shall be as in clause 6.3
 * of ISO/IEC 23220-2 (i.e. in the 23220-2 namespace).
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
  const here = hasElement(evidence.parsed, NS_ISO_23220, 'issuing_country');
  const elsewhere = findElementAnyNs(evidence.parsed, 'issuing_country');
  if (!here) {
    if (elsewhere) {
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes: `issuing_country present in "${elsewhere.namespace}" but expected in "${NS_ISO_23220}".`,
      };
    }
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'issuing_country absent (optional).',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `Non-mDL issuing_country lives in "${NS_ISO_23220}".`,
  };
}

export const controlId = CONTROL_ID;
