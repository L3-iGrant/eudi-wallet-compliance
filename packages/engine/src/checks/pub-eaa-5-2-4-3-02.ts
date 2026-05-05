import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'PuB-EAA-5.2.4.3-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * PuB-EAA-5.2.4.3-02: A PuB-EAA must declare the country in which its
 * issuer is established, either via the `issuing_country` claim in
 * the payload OR via the qualified certificate that supports the
 * signature.
 *
 * Without an issuer-cert evaluator we can only verify the payload
 * side. The check is best-effort:
 *   - If `issuing_country` is present and a 2-letter uppercase ISO
 *     3166-1 alpha-2 string, return pass.
 *   - If the claim is present but malformed, fail.
 *   - If the claim is absent, return N/A and surface the cert path
 *     in the notes so the auditor knows compliance is still possible
 *     once an issuer-cert evaluator is wired up.
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
  if (!('issuing_country' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes:
        'issuing_country claim absent. The rule allows the country to be carried in the qualified certificate instead; supply the issuer certificate to verify that path.',
    };
  }
  const value = payload['issuing_country'];
  if (typeof value !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `issuing_country is ${describe(value)}, not an ISO 3166-1 alpha-2 country string.`,
    };
  }
  if (!/^[A-Z]{2}$/.test(value)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `issuing_country is "${value}", which is not an upper-case ISO 3166-1 alpha-2 code.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `issuing_country is "${value}".`,
  };
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
