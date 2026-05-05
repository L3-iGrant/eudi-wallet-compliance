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

const CONTROL_ID = 'EAA-6.2.4.1-09';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.4.1-09: ISO/IEC-mdoc EAA may include iss_reg_id.
 * Permissive rule; always passes.
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
  const found = findElement(evidence.parsed, NS_ETSI, 'iss_reg_id');
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      found === undefined
        ? 'iss_reg_id absent (optional).'
        : 'iss_reg_id present in the ETSI namespace.',
  };
}

export const controlId = CONTROL_ID;
