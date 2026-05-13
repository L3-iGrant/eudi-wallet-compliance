import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.1.2-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.1.2-01: A SD-JWT VC EAA shall include the vct claim.
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
  const vct = payload['vct'];
  if (typeof vct !== 'string' || vct.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'Payload is missing the vct claim, or vct is not a non-empty JSON string. Expected a URI/URN identifying the credential type (e.g. "urn:eudi:pid:1" or "https://issuer.example/credentials/pid/1.0"). The vct claim names the type-metadata document the verifier must dereference.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `vct claim present: ${vct}`,
  };
}

export const controlId = CONTROL_ID;
