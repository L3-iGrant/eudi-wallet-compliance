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
import { normaliseStatus } from './_status';

const CONTROL_ID = 'PuB-EAA-6.6.3-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * PuB-EAA-6.6.3-01: CB-AdES signing an mdoc PuB-EAA shall be a
 * qualified electronic signature or seal. Same posture as QEAA-6.6.2-01.
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
  return {
    controlId: CONTROL_ID,
    status: 'warn',
    evidenceRef: EVIDENCE_REF,
    notes:
      'Qualified-electronic-signature determination requires a trust-list lookup; deferred. Surfaced as warning at PuB-EAA scope.',
  };
}

export const controlId = CONTROL_ID;
