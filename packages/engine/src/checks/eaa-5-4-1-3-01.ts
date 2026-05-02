import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.4.1.3-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.3-01: A SD-JWT VC EAA shall contain one disclosure for each
 * selectively-disclosable attested attribute.
 *
 * Structural interpretation: every disclosure attached to the compact
 * form must correspond to an entry in the payload's `_sd` digest array
 * (i.e. counts must match for object-property disclosures). Returns N/A
 * when neither disclosures nor `_sd` are present.
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
  const sdArray = Array.isArray(sd) ? (sd as unknown[]) : [];
  if (disclosures.length === 0 && sdArray.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No disclosures and no _sd digests; rule applies only when SD is exercised.',
    };
  }
  // Object-property disclosures: a 3-element array. Count them and
  // compare with _sd length. Array-element disclosures (2-element arrays)
  // are not represented in `_sd`; they are out of scope for this counting
  // check. The IETF SD-JWT counting rule is loose here, so we report a
  // warn rather than a fail when counts diverge.
  const propertyDisclosures = disclosures.filter((d) => {
    try {
      const decoded = JSON.parse(base64UrlDecodeToString(d));
      return Array.isArray(decoded) && decoded.length === 3;
    } catch {
      return false;
    }
  });
  if (propertyDisclosures.length === sdArray.length) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes: `${propertyDisclosures.length} object-property disclosure(s) match ${sdArray.length} _sd digest(s).`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'warn',
    evidenceRef: EVIDENCE_REF,
    notes: `${propertyDisclosures.length} object-property disclosure(s) but ${sdArray.length} _sd digest(s); counts do not match. Verify each disclosure has a digest in _sd and vice versa.`,
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
