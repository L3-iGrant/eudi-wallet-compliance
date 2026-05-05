import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.3-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.3-01: When the SD-JWT VC carries selectively-disclosable
 * attributes, it must incorporate the corresponding disclosures as
 * defined in IETF SD-JWT clause 5.4.1.
 *
 * Structural reading: count `_sd` digest entries anywhere in the
 * payload (top-level or nested). If any are present, the compact
 * serialisation must have at least one disclosure appended after
 * the JWS. We do not match digests to disclosures here; that is
 * covered by stricter SD-JWT verification.
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
  const sdCount = countSdDigests(payload);
  if (sdCount === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No _sd digests in payload; no disclosures required.',
    };
  }
  if (disclosures.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Payload declares ${sdCount} selectively-disclosable digest${
        sdCount === 1 ? '' : 's'
      } but no disclosures are appended to the compact serialisation.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `${sdCount} _sd digest${sdCount === 1 ? '' : 's'} declared and ${
      disclosures.length
    } disclosure${disclosures.length === 1 ? '' : 's'} appended.`,
  };
}

function countSdDigests(node: unknown): number {
  if (Array.isArray(node)) {
    return node.reduce<number>((sum, item) => sum + countSdDigests(item), 0);
  }
  if (node !== null && typeof node === 'object') {
    let total = 0;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === '_sd' && Array.isArray(v)) {
        total += v.length;
      } else {
        total += countSdDigests(v);
      }
    }
    return total;
  }
  return 0;
}

export const controlId = CONTROL_ID;
