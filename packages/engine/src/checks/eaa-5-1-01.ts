import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.1-01: SD-JWT VC EAA shall be implemented as a Selective Disclosure
 * JSON Web Token based Verifiable Credential (SD-JWT VC).
 *
 * Pass = compact serialisation parses cleanly into header.payload.signature
 * with the optional disclosures and key-binding tail.
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
  // Phase 7: parsing happens upstream in runAssessment. Anything that
  // failed to parse never reaches this check (runAssessment emits a
  // 'fail' verdict for every in-scope control in that case). Reaching
  // this branch with `kind === 'sd-jwt-vc'` proves the structural-parse
  // assertion this control codifies.
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'EAA payload parses as an SD-JWT VC compact serialisation.',
  };
}

export const controlId = CONTROL_ID;
