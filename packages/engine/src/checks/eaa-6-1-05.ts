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

const CONTROL_ID = 'EAA-6.1-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.1-05: if the EAA is a mDL, the "presence" column of Table 5 of
 * ISO/IEC 18013-5 shall apply. Verifying every mandatory element from
 * Table 5 requires the table itself; per-element checks land in §6.2
 * (e.g. document_number, issuing_authority). This rule is reported as
 * deferred.
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
  return {
    controlId: CONTROL_ID,
    status: 'na',
    evidenceRef: EVIDENCE_REF,
    notes:
      'Verification of the full ISO/IEC 18013-5 Table 5 presence column is deferred; per-element rules under §6.2 cover the EAA-specific subset.',
  };
}

export const controlId = CONTROL_ID;
