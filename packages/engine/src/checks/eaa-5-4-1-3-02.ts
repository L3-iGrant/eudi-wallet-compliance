import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.4.1.3-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.3-02: When a SD-JWT VC EAA is serialised, the disclosures
 * shall be incorporated per IETF SD-JWT.
 *
 * Each disclosure must:
 *  - be a base64url-encoded JSON array,
 *  - decode to an array of length 3 (claim disclosure: salt, name, value)
 *    or length 2 (array-element disclosure: salt, value).
 *
 * Returns N/A when the EAA carries no disclosures.
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
  let disclosures: string[];
  try {
    ({ disclosures } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }
  if (disclosures.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'EAA carries no disclosures.',
    };
  }
  const malformed: string[] = [];
  for (let i = 0; i < disclosures.length; i++) {
    const d = disclosures[i] ?? '';
    let decoded: unknown;
    try {
      decoded = JSON.parse(base64UrlDecodeToString(d));
    } catch {
      malformed.push(`#${i + 1}: not a base64url-encoded JSON value`);
      continue;
    }
    if (!Array.isArray(decoded)) {
      malformed.push(`#${i + 1}: decoded value is not a JSON array`);
      continue;
    }
    if (decoded.length !== 2 && decoded.length !== 3) {
      malformed.push(
        `#${i + 1}: array length ${decoded.length}; expected 2 (array-element) or 3 (object-property)`,
      );
      continue;
    }
    if (typeof decoded[0] !== 'string') {
      malformed.push(`#${i + 1}: salt (element 0) is not a string`);
      continue;
    }
    if (decoded.length === 3 && typeof decoded[1] !== 'string') {
      malformed.push(`#${i + 1}: claim name (element 1) is not a string`);
    }
  }
  if (malformed.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Malformed disclosures: ${malformed.join('; ')}`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `${disclosures.length} disclosure(s) parsed as valid IETF SD-JWT structures.`,
  };
}

function base64UrlDecodeToString(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  if (typeof atob === 'function') {
    return atob(base64);
  }
  return Buffer.from(base64, 'base64').toString('binary');
}

export const controlId = CONTROL_ID;
