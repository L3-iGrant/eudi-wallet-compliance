import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

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
  const { payload } = evidence.parsed;
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

  const certRefKeys = ['x5c', 'x5t#S256', 'x5u'];

  // Path 1: JWK public key.
  if (cnf['jwk'] !== undefined) {
    const jwk = cnf['jwk'];
    if (typeof jwk !== 'object' || jwk === null || Array.isArray(jwk)) {
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes: 'cnf.jwk is present but not a JSON object. Expected an RFC 7517 JWK with kty (and the curve/coordinate fields it requires).',
      };
    }
    const validation = validateJwk(jwk as Record<string, unknown>);
    if (!validation.ok) {
      const nestedCertRefs = certRefKeys.filter(
        (k) => (jwk as Record<string, unknown>)[k] !== undefined,
      );
      const hint = nestedCertRefs.length
        ? ` Note: ${nestedCertRefs.join(', ')} appears under cnf.jwk; certificate references belong directly under cnf (not nested inside jwk). Either supply a proper public-key JWK with kty, or move ${nestedCertRefs.join(' / ')} up one level to cnf.`
        : ' Expected an RFC 7517 JWK; if you intended to convey a certificate reference instead, place x5c / x5t#S256 / x5u directly under cnf rather than under cnf.jwk.';
      return {
        controlId: CONTROL_ID,
        status: 'fail',
        evidenceRef: EVIDENCE_REF,
        notes: `cnf.jwk is malformed: ${validation.reason}.${hint}`,
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
    notes: 'cnf is present but contains neither a jwk (RFC 7517 public key with kty) nor an x5c / x5t#S256 / x5u certificate reference at the cnf level.',
  };
}

export const controlId = CONTROL_ID;
