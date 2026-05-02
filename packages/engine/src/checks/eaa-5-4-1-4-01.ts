import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.4.1.4-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.4-01: When a SD-JWT VC EAA carries selectively-disclosable
 * JSON properties, the payload shall include the `_sd` component
 * containing their disclosure digests.
 *
 * Structural interpretation: if there is at least one object-property
 * disclosure (a 3-element JSON array on the wire), then the payload
 * must include `_sd` as a non-empty array of strings.
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
  const propertyDisclosureCount = disclosures.filter((d) => {
    try {
      const decoded = JSON.parse(base64UrlDecodeToString(d));
      return Array.isArray(decoded) && decoded.length === 3;
    } catch {
      return false;
    }
  }).length;
  if (propertyDisclosureCount === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No object-property disclosures; rule applies only when JSON properties are selectively disclosed.',
    };
  }
  const sd = payload['_sd'];
  if (!Array.isArray(sd) || sd.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `${propertyDisclosureCount} object-property disclosure(s) present but payload._sd is missing or empty.`,
    };
  }
  if (!sd.every((x) => typeof x === 'string' && x.length > 0)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'payload._sd contains non-string or empty entries; expected non-empty string digests.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `payload._sd carries ${sd.length} disclosure digest(s).`,
  };
}

function base64UrlDecodeToString(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  if (typeof atob === 'function') return atob(base64);
  return Buffer.from(base64, 'base64').toString('binary');
}

export const controlId = CONTROL_ID;
