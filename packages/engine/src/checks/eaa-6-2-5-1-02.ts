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

const CONTROL_ID = 'EAA-6.2.5.1-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.5.1-02: an mDL shall include either the complete triplet
 * (given_name, family_name, document_number) or the also_known_as
 * pseudonym. Fails when neither is present.
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
  if (!isMdl(evidence.parsed)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only to mDL credentials.',
    };
  }
  const tripletPresent =
    hasElement(evidence.parsed, NS_MDL, 'given_name') &&
    hasElement(evidence.parsed, NS_MDL, 'family_name') &&
    hasElement(evidence.parsed, NS_MDL, 'document_number');
  const akaPresent = hasElement(evidence.parsed, NS_ETSI, 'also_known_as');
  if (!tripletPresent && !akaPresent) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'mDL has neither the full subject triplet nor an also_known_as pseudonym.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: tripletPresent
      ? 'mDL carries the full subject identifier triplet.'
      : 'mDL carries the also_known_as pseudonym.',
  };
}

export const controlId = CONTROL_ID;
