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

const CONTROL_ID = 'QEAA-6.2.4.2-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * QEAA-6.2.4.2-01: legal-person QEAA where reg ID is applicable shall
 * include reg ID in iss_reg_id or in qualified cert. We cannot detect
 * "legal person" or "applicable" without external information; only
 * fire when scope.tier === 'qeaa' and surface a warn when neither
 * iss_reg_id nor x5chain is present.
 */
export async function check(
  evidence: ParsedEvidence,
  scope: AssessmentScope,
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
  if (scope.tier !== 'qeaa') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only when scope.tier is qeaa.',
    };
  }
  const reg = findElement(evidence.parsed, NS_ETSI, 'iss_reg_id');
  const x5chain = evidence.parsed.issuerAuth.protectedHeader.x5chain;
  if (reg === undefined && (!x5chain || x5chain.length === 0)) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes:
        'QEAA scope but neither iss_reg_id nor a certificate chain is present. If the issuer is a legal person and a registration identifier is applicable, one of the two must be supplied. Detecting "legal person" is deferred; flagged as warning.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      reg !== undefined
        ? 'iss_reg_id present at QEAA scope.'
        : 'x5chain present at QEAA scope.',
  };
}

export const controlId = CONTROL_ID;
