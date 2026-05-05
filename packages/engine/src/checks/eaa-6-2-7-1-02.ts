import type { ParsedEvidence } from '@iwc/shared';
import type { CheckExtras } from '../registry';
import type { AssessmentScope, Verdict } from '../types';
import {
  MDL_DOC_TYPE,
  NS_MDL,
  NS_ISO_23220,
  NS_ETSI,
  isMdl,
  primaryNamespace,
  hasElement,
  findElement,
  findElementAnyNs,
} from './_mdoc';

const CONTROL_ID = 'EAA-6.2.7.1-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.7.1-02: validityInfo.validUntil shall implement the end time
 * of the technical validity period.
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
  const validUntil = evidence.parsed.issuerAuth.mso.validityInfo.validUntil;
  if (!(validUntil instanceof Date) || Number.isNaN(validUntil.getTime())) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'validityInfo.validUntil is missing or not a valid date.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `validityInfo.validUntil = ${validUntil.toISOString()}.`,
  };
}

export const controlId = CONTROL_ID;
