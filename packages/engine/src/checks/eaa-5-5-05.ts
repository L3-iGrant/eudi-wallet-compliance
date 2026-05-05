import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.5-05';
const EVIDENCE_REF = 'eaa-payload';
const X5T_S256 = 'x5t#S256';

/**
 * EAA-5.5-05: If the EAA subject certificate is represented in cnf by
 * the x5c parameter, neither the x5u nor the x5t#S256 parameter shall
 * also be present.
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
  const hasX5c = obj['x5c'] !== undefined;
  if (!hasX5c) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'cnf does not include x5c; rule applies only when x5c is present.',
    };
  }
  const stray: string[] = [];
  if (obj['x5u'] !== undefined) stray.push('x5u');
  if (obj[X5T_S256] !== undefined) stray.push(X5T_S256);
  if (stray.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `cnf.x5c is present alongside ${stray.join(', ')}. When x5c is used, neither x5u nor x5t#S256 may be present.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'cnf.x5c is present without x5u or x5t#S256.',
  };
}

export const controlId = CONTROL_ID;
