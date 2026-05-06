import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.8.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.8.1-01: An SD-JWT VC EAA must NOT incorporate any audience
 * component implementing the semantics of clause 4.2.9.2 (the
 * abstract audience-constraint rule). In SD-JWT VC the audience
 * concept maps to the JWT `aud` claim, so this check fails when
 * `aud` is present in the payload.
 *
 * Returns pass when `aud` is absent, fail when present.
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
  if ('aud' in payload) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'aud claim is present; an SD-JWT VC EAA must not carry an audience constraint.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'aud claim absent, as required.',
  };
}

export const controlId = CONTROL_ID;
