import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.4.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.4.1-03: A SD-JWT VC EAA shall not incorporate the
 * issuing_authority claim if it incorporates the qualified certificate
 * supporting the EAA signature.
 *
 * Detecting "qualified" status from a certificate alone requires a trust
 * list lookup; that piece is deferred. For v1 we approximate: when both
 * x5c and issuing_authority are present, we warn and explain the
 * approximation. Otherwise we pass.
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
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    ({ header, payload } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }

  const x5c = header['x5c'];
  const hasX5c = Array.isArray(x5c) && x5c.length > 0;
  const hasIssuingAuthority =
    typeof payload['issuing_authority'] === 'string' &&
    (payload['issuing_authority'] as string).length > 0;

  if (hasX5c && hasIssuingAuthority) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes:
        'Both x5c (certificate chain) and issuing_authority are present. ' +
        'When the embedded certificate is qualified, issuing_authority must be omitted. ' +
        'Detecting qualified status from a certificate alone requires a trust-list lookup, ' +
        'which is deferred to a later release; this is flagged as a warning rather than a hard failure.',
    };
  }

  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: hasX5c
      ? 'x5c present without issuing_authority. Compatible.'
      : hasIssuingAuthority
        ? 'issuing_authority present without an embedded certificate chain. Compatible.'
        : 'Neither x5c nor issuing_authority present. Rule trivially satisfied.',
  };
}

export const controlId = CONTROL_ID;
