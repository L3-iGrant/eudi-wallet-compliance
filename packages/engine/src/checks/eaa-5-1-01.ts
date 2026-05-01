import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.1-01: SD-JWT VC EAA shall be implemented as a Selective Disclosure
 * JSON Web Token based Verifiable Credential (SD-JWT VC).
 *
 * Pass = compact serialisation parses cleanly into header.payload.signature
 * with the optional disclosures and key-binding tail.
 */
export function check(evidence: Evidence): Verdict {
  if (!evidence.eaaPayload) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  try {
    parseSdJwtVc(evidence.eaaPayload);
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload does not parse as an SD-JWT VC compact serialisation: ${message}`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'EAA payload parses as an SD-JWT VC compact serialisation.',
  };
}

export const controlId = CONTROL_ID;
