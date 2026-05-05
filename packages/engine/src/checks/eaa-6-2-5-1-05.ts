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

const CONTROL_ID = 'EAA-6.2.5.1-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.5.1-05: a non-mDL EAA shall include either the complete
 * triplet or the also_known_as pseudonym. Mirrors -02 for non-mDL.
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
  if (isMdl(evidence.parsed)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only to non-mDL credentials.',
    };
  }
  const tripletPresent =
    hasElement(evidence.parsed, NS_ISO_23220, 'given_name') &&
    hasElement(evidence.parsed, NS_ISO_23220, 'family_name') &&
    hasElement(evidence.parsed, NS_ISO_23220, 'document_number');
  const akaPresent = hasElement(evidence.parsed, NS_ETSI, 'also_known_as');
  if (!tripletPresent && !akaPresent) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'Non-mDL has neither the full subject triplet nor an also_known_as pseudonym.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: tripletPresent
      ? 'Non-mDL carries the full subject identifier triplet.'
      : 'Non-mDL carries the also_known_as pseudonym.',
  };
}

export const controlId = CONTROL_ID;
