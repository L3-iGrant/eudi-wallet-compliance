import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.4.1.4-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.4-01: A SD-JWT VC EAA containing one or more selectively
 * disclosable attested attributes that are JSON Properties (clause 4.2.1
 * of IETF SD-JWT) shall include the `_sd` component containing their
 * disclosure digests computed as specified in clause 5.2.4.1 of IETF
 * SD-JWT.
 *
 * IETF SD-JWT §5.2.4.1 places each property-disclosure digest in an
 * `_sd` array AT THE SAME LEVEL as the claim it replaces. The `_sd`
 * array can appear at the top of the payload OR nested inside any
 * intermediate JSON object (including objects that are themselves
 * elements of a JSON array). A payload where every selectively
 * disclosable property is nested inside a sub-object will legitimately
 * have NO top-level `_sd` member: only the nested ones.
 *
 * Engine rule:
 *   - na   : no object-property disclosures present
 *   - fail : there are property disclosures but no `_sd` digests anywhere
 *            in the payload, OR the total digest count is less than the
 *            number of property disclosures (a property disclosure
 *            without a matching digest is non-conformant)
 *   - pass : at least one `_sd` array exists and the cumulative digest
 *            count covers every property disclosure
 *
 * Strict digest-by-digest matching (computing the base64url(SHA-256) of
 * each disclosure and asserting presence in some `_sd` array) is a
 * stronger check; we keep the structural one here and leave that
 * verification to the runtime resolver.
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
      notes:
        'No object-property disclosures; rule applies only when JSON properties are selectively disclosed.',
    };
  }

  const { count: digestCount, paths } = collectAllSdDigests(payload);
  if (digestCount === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes:
        `${propertyDisclosureCount} object-property disclosure(s) present but no _sd array (top-level or nested) appears in the payload. ` +
        `Each property disclosure digest must appear in an _sd array at the same level as the claim it replaces (IETF SD-JWT §5.2.4.1).`,
    };
  }
  if (digestCount < propertyDisclosureCount) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes:
        `${propertyDisclosureCount} object-property disclosure(s) present, but only ${digestCount} _sd digest(s) found across the payload (at ${paths.join(', ') || '(none)'}). ` +
        `Each property disclosure digest must appear in an _sd array at the same level as the claim it replaces (IETF SD-JWT §5.2.4.1).`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `${digestCount} _sd digest(s) across ${paths.length} _sd array(s) cover ${propertyDisclosureCount} object-property disclosure(s).`,
  };
}

function base64UrlDecodeToString(s: string): string {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  if (typeof atob === 'function') return atob(base64);
  return Buffer.from(base64, 'base64').toString('binary');
}

/**
 * Walk the payload and total up every `_sd` array's length. Also collect
 * a dotted path for each `_sd` array found, so failure messages can
 * point the issuer to where their digests actually live. Array indices
 * are rendered as `[i]`.
 */
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
