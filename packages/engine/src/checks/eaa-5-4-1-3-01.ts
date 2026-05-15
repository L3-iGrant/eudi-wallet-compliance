import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.4.1.3-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.3-01: A SD-JWT VC EAA shall contain one disclosure for each
 * selectively-disclosable attested attribute.
 *
 * Structural interpretation: every object-property disclosure attached
 * to the compact form must correspond to an entry in SOME `_sd` digest
 * array in the payload. The `_sd` array can be at the top of the payload
 * OR nested inside any sub-object (including objects that are elements
 * of a JSON array). Counts must match overall.
 *
 * Array-element disclosures (2-element decoded arrays) are not counted
 * here; the IETF SD-JWT counting rule is loose for them.
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
  const { count: sdDigestCount, paths } = collectAllSdDigests(payload);
  if (disclosures.length === 0 && sdDigestCount === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No disclosures and no _sd digests; rule applies only when SD is exercised.',
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
  if (propertyDisclosureCount === sdDigestCount) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        `${propertyDisclosureCount} object-property disclosure(s) match ${sdDigestCount} _sd digest(s) across ${paths.length} _sd array(s) (${paths.join(', ') || '<root>'}).`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'warn',
    evidenceRef: EVIDENCE_REF,
    notes:
      `${propertyDisclosureCount} object-property disclosure(s) but ${sdDigestCount} _sd digest(s) across ${paths.length} _sd array(s) (${paths.join(', ') || '<root>'}); counts do not match. Verify each disclosure has a matching digest.`,
  };
}

function base64UrlDecodeToString(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  if (typeof atob === 'function') return atob(base64);
  return Buffer.from(base64, 'base64').toString('binary');
}

function collectAllSdDigests(payload: Record<string, unknown>): {
  count: number;
  paths: string[];
} {
  let count = 0;
  const paths: string[] = [];
  function walk(node: unknown, path: string): void {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) walk(node[i], `${path}[${i}]`);
      return;
    }
    if (typeof node !== 'object') return;
    const rec = node as Record<string, unknown>;
    const sd = rec['_sd'];
    if (Array.isArray(sd) && sd.length > 0) {
      count += sd.filter((x) => typeof x === 'string' && x.length > 0).length;
      paths.push(path || '<root>');
    }
    for (const [k, v] of Object.entries(rec)) {
      if (k === '_sd' || k === '_sd_alg') continue;
      walk(v, path ? `${path}.${k}` : k);
    }
  }
  walk(payload, '');
  return { count, paths };
}

export const controlId = CONTROL_ID;
