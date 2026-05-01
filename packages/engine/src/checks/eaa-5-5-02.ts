import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.5-02';
const EVIDENCE_REF = 'eaa-payload';

interface JwkValidation {
  ok: boolean;
  reason?: string;
}

function validateJwk(jwk: Record<string, unknown>): JwkValidation {
  const kty = jwk['kty'];
  if (typeof kty !== 'string') {
    return { ok: false, reason: 'jwk.kty missing or not a string' };
  }
  switch (kty) {
    case 'EC': {
      const required = ['crv', 'x', 'y'];
      for (const k of required) {
        if (typeof jwk[k] !== 'string') {
          return { ok: false, reason: `jwk.${k} missing or not a string for kty=EC` };
        }
      }
      return { ok: true };
    }
    case 'RSA': {
      const required = ['n', 'e'];
      for (const k of required) {
        if (typeof jwk[k] !== 'string') {
          return { ok: false, reason: `jwk.${k} missing or not a string for kty=RSA` };
        }
      }
      return { ok: true };
    }
    case 'OKP': {
      const required = ['crv', 'x'];
      for (const k of required) {
        if (typeof jwk[k] !== 'string') {
          return { ok: false, reason: `jwk.${k} missing or not a string for kty=OKP` };
        }
      }
      return { ok: true };
    }
    default:
      return {
        ok: false,
        reason: `jwk.kty="${kty}" is not supported for cnf (expected EC, RSA, or OKP)`,
      };
  }
}

/**
 * EAA-5.5-02: When cnf is present, it must contain a JWK public key OR a
 * certificate reference (x5c, x5t#S256, x5u). When cnf is absent, the
 * rule is N/A (EAA-5.5-01 already flags absence).
 */
export function check(evidence: Evidence, _scope: AssessmentScope): Verdict {
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
  const cnfRaw = payload['cnf'];
  if (cnfRaw === undefined || cnfRaw === null) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf claim is absent; rule applies only when cnf is present.',
    };
  }
  if (typeof cnfRaw !== 'object' || Array.isArray(cnfRaw)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf is present but is not a JSON object.',
    };
  }
  const cnf = cnfRaw as Record<string, unknown>;

  // Path 1: JWK public key.
  if (cnf['jwk'] !== undefined) {
    const jwk = cnf['jwk'];
    if (typeof jwk !== 'object' || jwk === null || Array.isArray(jwk)) {
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes: 'cnf.jwk is present but not a JSON object.',
      };
    }
    const validation = validateJwk(jwk as Record<string, unknown>);
    if (!validation.ok) {
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes: `cnf.jwk is malformed: ${validation.reason}.`,
      };
    }
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes: `cnf.jwk is well-formed (kty=${(jwk as Record<string, unknown>)['kty']}).`,
    };
  }

  // Path 2: certificate reference.
  const certRefKeys = ['x5c', 'x5t#S256', 'x5u'];
  const presentCertRefs = certRefKeys.filter((k) => cnf[k] !== undefined);
  if (presentCertRefs.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes: `cnf carries a certificate reference (${presentCertRefs.join(', ')}).`,
    };
  }

  return {
    controlId: CONTROL_ID,
    status: 'fail',
    evidenceRef: EVIDENCE_REF,
    notes: 'cnf is present but contains neither a jwk nor an x5c/x5t#S256/x5u reference.',
  };
}

export const controlId = CONTROL_ID;
