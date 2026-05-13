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

const CONTROL_ID = 'EAA-6.2.4.1-10';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.4.1-10: iss_reg_id shall be of tstr type.
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
  if (found === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'iss_reg_id absent; rule applies only when present.',
    };
  }
  if (typeof found !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `iss_reg_id is present but is not a CBOR text string (tstr); got ${typeof found}. ETSI TS 119 471 expects iss_reg_id in the "${NS_ETSI}" namespace to be a tstr carrying the issuer\'s registration identifier (ETSI EN 319 412-1 §5.1.4 format <3-letter scheme><2-letter country>-<reference>, e.g. "VATBE-1234567890"). Encode it as a CBOR text string, not a byte string, integer or array.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'iss_reg_id is a tstr.',
  };
}

export const controlId = CONTROL_ID;
