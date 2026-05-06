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

const CONTROL_ID = 'PuB-EAA-6.2.10.3-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * PuB-EAA-6.2.10.3-01: an mdoc PuB-EAA without shortLived shall contain
 * status in MSO. Mirror of QEAA-6.2.10.2-01.
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
  const shortLived = findElement(evidence.parsed, NS_ETSI, 'shortLived');
  const status = evidence.parsed.issuerAuth.mso.status;
  if (shortLived === true) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'shortLived is true; status not required.',
    };
  }
  if (status === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'PuB-EAA scope and shortLived is not true, but status is absent from MSO.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'PuB-EAA carries status in MSO.',
  };
}

export const controlId = CONTROL_ID;
