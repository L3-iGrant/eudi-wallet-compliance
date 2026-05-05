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

const CONTROL_ID = 'EAA-6.2.5.1-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.5.1-04: if a non-mDL credential identifies its subject, it
 * shall include given_name, family_name and document_number per
 * ISO/IEC 23220-2 §6.3 in the 23220-2 namespace. Same logic as -01.
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
  const has = (id: string) => hasElement(evidence.parsed, NS_ISO_23220, id);
  const aka = hasElement(evidence.parsed, NS_ETSI, 'also_known_as');
  const triplet = ['given_name', 'family_name', 'document_number'];
  const present = triplet.filter(has);
  if (present.length === 0 && aka) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Non-mDL uses the also_known_as pseudonym route; -05 governs.',
    };
  }
  if (present.length !== 3) {
    const missing = triplet.filter((e) => !has(e));
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Non-mDL identifies its subject but is missing: ${missing.join(', ')}.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'Non-mDL carries given_name, family_name and document_number in the 23220-2 namespace.',
  };
}

export const controlId = CONTROL_ID;
