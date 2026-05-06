import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'PuB-EAA-5.2.4.3-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * PuB-EAA-5.2.4.3-03: When a PuB-EAA is issued by a legal person and
 * a registration identifier applies, the identifier must be carried
 * either in the `iss_reg_id` claim OR in the qualified certificate
 * supporting the signature.
 *
 * Without an issuer-cert evaluator we can only verify the payload
 * side. We deliberately do not fail when the claim is absent because
 * the cert path is allowed; the verdict turns to N/A and the notes
 * surface the unfinished cert side. PuB-EAA-5.2.4.3-04 covers the
 * format check when the claim is present.
 */
export async function check(
  evidence: ParsedEvidence,
  scope: AssessmentScope,
  extras: CheckExtras,
): Promise<Verdict> {
  if (scope.tier !== 'pub-eaa') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: `Rule applies to PuB-EAA only; current tier is ${scope.tier}.`,
    };
  }
  if (evidence.kind !== 'sd-jwt-vc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to SD-JWT VC evidence only.',
    };
  }
  const { payload } = evidence.parsed;
  if (!('iss_reg_id' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes:
        'iss_reg_id claim absent. The rule allows the registration identifier to be carried in the qualified certificate instead; supply the issuer certificate to verify that path. If the issuer is a natural person or no registration identifier applies, the rule is not engaged.',
    };
  }
  const value = payload['iss_reg_id'];
  if (typeof value !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `iss_reg_id is ${describe(value)}, not a JSON string.`,
    };
  }
  if (value.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'iss_reg_id is an empty string.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `iss_reg_id is present ("${value}"). Format is checked separately by PuB-EAA-5.2.4.3-04.`,
  };
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
