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

const CONTROL_ID = 'EAA-6.2.4.1-06';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.4.1-06: if mDL, issuing_country shall be as in Table 5 of
 * ISO/IEC 18013-5 §7.2.1 (i.e. in the mDL namespace if present).
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
  const here = hasElement(evidence.parsed, NS_MDL, 'issuing_country');
  const elsewhere = findElementAnyNs(evidence.parsed, 'issuing_country');
  if (!here) {
    if (elsewhere) {
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes: `issuing_country present in "${elsewhere.namespace}" but expected in "${NS_MDL}".`,
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
    notes: `mDL issuing_country lives in "${NS_MDL}".`,
  };
}

export const controlId = CONTROL_ID;
