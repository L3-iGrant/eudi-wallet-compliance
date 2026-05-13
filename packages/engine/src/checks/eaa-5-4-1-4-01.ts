import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

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
    const nestedPaths = findNestedSdPaths(payload);
    const nestedHint = nestedPaths.length
      ? ` Nested _sd array(s) exist under ${nestedPaths.join(', ')}, but those govern only sub-properties of their containing object and cannot satisfy a disclosure for a top-level claim.`
      : '';
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `${propertyDisclosureCount} object-property disclosure(s) present but the top-level _sd array is missing or empty. Each property disclosure's digest must appear in the _sd array at the same level as the claim it replaces.${nestedHint}`,
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

function findNestedSdPaths(payload: Record<string, unknown>): string[] {
  const paths: string[] = [];
  function walk(obj: unknown, path: string) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return;
    const rec = obj as Record<string, unknown>;
    if (path && Array.isArray(rec['_sd'])) paths.push(path);
    for (const [k, v] of Object.entries(rec)) {
      if (k === '_sd') continue;
      walk(v, path ? `${path}.${k}` : k);
    }
  }
  walk(payload, '');
  return paths;
}

export const controlId = CONTROL_ID;
