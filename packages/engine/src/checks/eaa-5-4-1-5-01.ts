import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.4.1.5-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.5-01: The `_sd_alg` component must implement the
 * disclosure-algorithm-identifier semantics specified in clause 4.4.2.5
 * of the present document, profiled per IETF SD-JWT VC.
 *
 * Structural interpretation: when `_sd_alg` is present, its value must
 * be a string naming a hash algorithm registered in the IANA "Named
 * Information Hash Algorithm Registry" (per IETF SD-JWT clause 5.1.1).
 * The most common values are sha-256, sha-384, sha-512.
 */
const REGISTERED_HASH_ALGS = new Set([
  'sha-256',
  'sha-384',
  'sha-512',
  'sha3-256',
  'sha3-384',
  'sha3-512',
  'blake2s-256',
  'blake2b-256',
  'blake2b-512',
]);

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
  try {
    ({ payload } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }
  const sdAlg = payload['_sd_alg'];
  if (sdAlg === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: '_sd_alg absent; rule applies only when _sd_alg is present.',
    };
  }
  if (typeof sdAlg !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: '_sd_alg is present but not a JSON string.',
    };
  }
  if (!REGISTERED_HASH_ALGS.has(sdAlg.toLowerCase())) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes: `_sd_alg value "${sdAlg}" is not a commonly-registered IANA Named Information hash algorithm. Verify it is registered.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `_sd_alg = "${sdAlg}" (registered hash algorithm).`,
  };
}

export const controlId = CONTROL_ID;
