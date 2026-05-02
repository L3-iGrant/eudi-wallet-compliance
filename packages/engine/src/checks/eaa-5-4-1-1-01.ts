import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

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
  evidence: Evidence,
  _scope: AssessmentScope,
): Promise<Verdict> {
  if (!evidence.eaaPayload) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  let payload: Record<string, unknown>;
  let disclosures: string[];
  try {
    ({ payload, disclosures } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }
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
