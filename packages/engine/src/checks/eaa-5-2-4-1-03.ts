import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

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
  const { header, payload } = evidence.parsed;

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
