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

const CONTROL_ID = 'EAA-6.2.2.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.2.1-01: ISO/IEC-mdoc EAAs issued by EU issuers that are
 * neither QEAA nor PuB-EAA shall not include the category data element.
 * We cannot reliably know "EU issuer" without trust-list lookup, so the
 * check warns when category is present at the ordinary tier rather than
 * failing.
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
  const found = findElementAnyNs(evidence.parsed, 'category');
  if (scope.tier === 'ordinary' && found !== undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes:
        'Ordinary-tier EAA carries a category data element. If the issuer is registered in the EU and the EAA is neither QEAA nor PuB-EAA, this violates §6.2.2.1-01. EU-issuer detection requires a trust-list lookup; flagged as warning.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      found === undefined
        ? 'category data element absent at the ordinary tier.'
        : 'Tier is not ordinary; the prohibition does not apply.',
  };
}

export const controlId = CONTROL_ID;
