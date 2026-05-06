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

const CONTROL_ID = 'PuB-EAA-6.2.4.3-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * PuB-EAA-6.2.4.3-01: PuB-EAA where reg ID is applicable shall include
 * reg ID in iss_reg_id or in qualified cert. Mirrors the QEAA rule;
 * "applicable" detection is deferred.
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
  if (scope.tier !== 'pub-eaa') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only when scope.tier is pub-eaa.',
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
        'PuB-EAA scope but neither iss_reg_id nor a certificate chain is present. If a registration identifier is applicable, one of the two must be supplied. Flagged as warning.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      reg !== undefined
        ? 'iss_reg_id present at PuB-EAA scope.'
        : 'x5chain present at PuB-EAA scope.',
  };
}

export const controlId = CONTROL_ID;
