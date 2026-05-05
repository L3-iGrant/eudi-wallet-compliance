import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.5-04';
const EVIDENCE_REF = 'eaa-payload';
const X5T_S256 = 'x5t#S256';

/**
 * EAA-5.5-04: If the EAA subject certificate is represented in cnf by
 * the x5u parameter, the x5t#S256 parameter shall also be present.
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
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf claim absent; rule applies only when cnf is present.',
    };
  }
  if (typeof cnf !== 'object' || Array.isArray(cnf)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf is present but not a JSON object.',
    };
  }
  const obj = cnf as Record<string, unknown>;
  const hasX5u = obj['x5u'] !== undefined;
  if (!hasX5u) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf does not include x5u; rule applies only when x5u is present.',
    };
  }
  const hasX5tS256 = obj[X5T_S256] !== undefined;
  if (!hasX5tS256) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf.x5u is present but cnf.x5t#S256 is missing. The pair is required.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'cnf.x5u is paired with cnf.x5t#S256.',
  };
}

export const controlId = CONTROL_ID;
