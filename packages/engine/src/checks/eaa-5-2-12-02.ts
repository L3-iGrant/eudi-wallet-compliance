import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.12-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.12-02: When the shortLived claim is present, it must be the
 * JSON `null` primitive type. Like oneTime, shortLived is a presence
 * flag and does not carry a value.
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
  if (!('shortLived' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'shortLived claim absent.',
    };
  }
  if (payload['shortLived'] !== null) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `shortLived is present but not JSON null (got ${typeof payload['shortLived']}). The claim is a flag and must use the null primitive.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'shortLived is JSON null.',
  };
}

export const controlId = CONTROL_ID;
