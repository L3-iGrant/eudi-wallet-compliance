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

const CONTROL_ID = 'EAA-6.1-07';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.1-07: ISO/IEC-mdoc EAA shall be an instance of IssuerSigned per
 * ISO/IEC 18013-5 §8.3.2.1.2.2. Reaching this branch with a parsed mdoc
 * proves the shape (parseMdoc enforces both the nameSpaces map and the
 * issuerAuth COSE_Sign1 four-tuple).
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
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'Payload parses as IssuerSigned per ISO/IEC 18013-5 §8.3.2.1.2.2.',
  };
}

export const controlId = CONTROL_ID;
