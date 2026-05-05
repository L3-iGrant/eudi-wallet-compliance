import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.4.1.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.1-01: A SD-JWT VC EAA shall support the selective disclosure
 * of attributes using IETF SD-JWT (VC) components.
 *
 * Structurally testable as: when an EAA carries disclosures or `_sd`
 * digests, it is presumed to support SD; when neither is present, the
 * rule is N/A (the credential simply does not exercise SD).
 */
export async function check(
  evidence: ParsedEvidence,
  _scope: AssessmentScope,
  _extras: CheckExtras,
): Promise<Verdict> {
  if (evidence.kind !== 'sd-jwt-vc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to SD-JWT VC evidence only.',
    };
  }
  const { payload, disclosures } = evidence.parsed;
  const sd = payload['_sd'];
  const hasSdArray = Array.isArray(sd) && sd.length > 0;
  if (disclosures.length > 0 || hasSdArray) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes: `Selective disclosure exercised: ${disclosures.length} disclosure(s), ${hasSdArray ? (sd as unknown[]).length : 0} _sd digest(s).`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'na',
    evidenceRef: EVIDENCE_REF,
    notes: 'EAA carries no disclosures and no _sd component; SD support not exercised by this credential.',
  };
}

export const controlId = CONTROL_ID;
