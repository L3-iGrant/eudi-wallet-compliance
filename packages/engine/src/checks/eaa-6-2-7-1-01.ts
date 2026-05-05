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

const CONTROL_ID = 'EAA-6.2.7.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.7.1-01: validityInfo.validFrom shall implement the start time
 * of the technical validity period. Structurally: validFrom is a JS
 * Date in the parser's MSO; missing or non-Date fails the rule.
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
  const validFrom = evidence.parsed.issuerAuth.mso.validityInfo.validFrom;
  if (!(validFrom instanceof Date) || Number.isNaN(validFrom.getTime())) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'validityInfo.validFrom is missing or not a valid date.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `validityInfo.validFrom = ${validFrom.toISOString()}.`,
  };
}

export const controlId = CONTROL_ID;
