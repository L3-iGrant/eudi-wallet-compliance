import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.1.2-03';
const EVIDENCE_REF = 'eaa-payload';
const INTEGRITY_CLAIM = 'vct#integrity';

/**
 * EAA-5.2.1.2-03: A SD-JWT VC EAA shall incorporate the claim vct#integrity.
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
  const integrity = payload[INTEGRITY_CLAIM];
  if (typeof integrity !== 'string' || integrity.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Payload is missing the ${INTEGRITY_CLAIM} claim, or its value is not a non-empty JSON string. ${INTEGRITY_CLAIM} is an SRI-style integrity digest (per W3C SRI) over the type-metadata document referenced by vct, so a verifier can detect tampered metadata. Expected a value like "sha256-04bd32139d56c2c7029b7bfc8a606b8a63af97b77c2d32b6eddc1306359fb4e9" (algorithm prefix "sha256-" / "sha384-" / "sha512-" followed by a base64-encoded digest of the type-metadata bytes).`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `${INTEGRITY_CLAIM} claim present.`,
  };
}

export const controlId = CONTROL_ID;
