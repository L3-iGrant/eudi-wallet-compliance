import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.8.2-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.8.2-05: When the oneTime claim is present, it must be the
 * JSON `null` primitive type. The presence flag conveys "single use";
 * it does not carry a value.
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
  if (!('oneTime' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'oneTime claim absent.',
    };
  }
  if (payload['oneTime'] !== null) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `oneTime is present but not JSON null (got ${typeof payload['oneTime']}). The claim is a flag and must use the null primitive.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'oneTime is JSON null.',
  };
}

export const controlId = CONTROL_ID;
