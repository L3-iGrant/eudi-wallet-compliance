import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.5-06';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.5-06: The cnf claim *should* contain a representation of the
 * EAA subject public key. The catalogue separately permits cnf to
 * carry a certificate representation (via x5c / x5t#S256 / x5u under
 * EAA-5.5-03), but this rule prefers the public-key form.
 *
 * Verdict mapping (`should`-tier rule):
 *   pass: cnf has a direct public-key representation (jwk or kid)
 *   warn: cnf only has a certificate representation
 *   na:   cnf absent
 *   fail: cnf is malformed (not a JSON object)
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
  if (!('cnf' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf claim absent.',
    };
  }
  const cnf = payload['cnf'];
  if (typeof cnf !== 'object' || cnf === null || Array.isArray(cnf)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf is present but not a JSON object.',
    };
  }
  const obj = cnf as Record<string, unknown>;
  const hasKey = 'jwk' in obj || 'kid' in obj;
  const hasCert = 'x5c' in obj || 'x5t#S256' in obj || 'x5u' in obj;
  if (hasKey) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf carries a direct public-key representation (jwk or kid).',
    };
  }
  if (hasCert) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf carries only a certificate representation (x5c / x5t#S256 / x5u). The spec recommends a direct public-key form.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'fail',
    evidenceRef: EVIDENCE_REF,
    notes: 'cnf has no recognised key or certificate representation.',
  };
}

export const controlId = CONTROL_ID;
