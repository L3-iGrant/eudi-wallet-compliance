import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.5-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.5-01: A SD-JWT VC EAA should incorporate the cnf claim for
 * holder key binding (see EAA-5.5-02 for the cnf shape rules).
 *
 * The spec uses "should", not "shall", so absence is a warn, not a fail.
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
  const cnf = payload['cnf'];
  if (cnf === undefined || cnf === null) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf claim absent. Recommended for key-bound EAAs.',
    };
  }
  if (typeof cnf !== 'object' || Array.isArray(cnf)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf claim is present but not a JSON object.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'cnf claim present.',
  };
}

export const controlId = CONTROL_ID;
