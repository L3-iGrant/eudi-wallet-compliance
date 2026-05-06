import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.7.2-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.7.2-05: A SD-JWT VC EAA either shall contain both the
 * adm_nbf and the adm_exp claims, or shall not contain any of them.
 *
 * Verdicts:
 *  - na   : no payload, or neither claim present (rule satisfied vacuously
 *           but nothing to evaluate; surfaced as "rule does not apply").
 *  - pass : both claims present.
 *  - fail : exactly one claim present (the violation).
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
  const hasNbf = 'adm_nbf' in payload;
  const hasExp = 'adm_exp' in payload;
  if (!hasNbf && !hasExp) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Neither adm_nbf nor adm_exp present; pairing rule not exercised.',
    };
  }
  if (hasNbf && hasExp) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes: 'adm_nbf and adm_exp both present.',
    };
  }
  const missing = hasNbf ? 'adm_exp' : 'adm_nbf';
  return {
    controlId: CONTROL_ID,
    status: 'fail',
    evidenceRef: EVIDENCE_REF,
    notes: `Only one of the pair present; ${missing} is missing. They must appear together or not at all.`,
  };
}

export const controlId = CONTROL_ID;
