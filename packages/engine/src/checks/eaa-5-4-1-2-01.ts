import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.4.1.2-01';
const EVIDENCE_REF = 'eaa-payload';

const FORBIDDEN_KEYS = ['disclosure_schema', 'sd_schema', 'sd_alg_id', 'disclosure_id'];

/**
 * EAA-5.4.1.2-01: A SD-JWT VC EAA shall not incorporate any component
 * for identifying the disclosure schema; the schema is implicit in the
 * SD-JWT media type.
 *
 * Structurally testable as: the payload must not carry claim names that
 * look like a disclosure-schema identifier.
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
  const found = FORBIDDEN_KEYS.filter((k) => k in payload);
  if (found.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Payload includes disclosure-schema identifier(s): ${found.join(', ')}. The schema is implicit in the SD-JWT media type and must not be carried explicitly.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'No explicit disclosure-schema identifier in payload.',
  };
}

export const controlId = CONTROL_ID;
