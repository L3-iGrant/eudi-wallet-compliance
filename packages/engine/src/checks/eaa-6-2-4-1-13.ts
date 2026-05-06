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

const CONTROL_ID = 'EAA-6.2.4.1-13';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.4.1-13: ISO/IEC-mdoc EAA shall not incorporate iss_reg_id if
 * it incorporates the qualified certificate supporting the signature.
 * Detecting "qualified" status from the cert chain alone requires a
 * trust-list lookup; deferred. We surface a warn when both iss_reg_id
 * and the x5chain header are present.
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
  const reg = findElement(evidence.parsed, NS_ETSI, 'iss_reg_id');
  const x5chain = evidence.parsed.issuerAuth.protectedHeader.x5chain;
  if (reg !== undefined && x5chain && x5chain.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes:
        'Both iss_reg_id and x5chain are present. If the embedded certificate is qualified, iss_reg_id must be omitted. Trust-list verification is deferred; flagged as warning.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      reg === undefined
        ? 'iss_reg_id absent; mutex trivially satisfied.'
        : 'No certificate chain present; mutex satisfied.',
  };
}

export const controlId = CONTROL_ID;
