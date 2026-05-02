import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

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
  evidence: Evidence,
  _scope: AssessmentScope,
): Promise<Verdict> {
  if (!evidence.eaaPayload) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  let payload: Record<string, unknown>;
  try {
    ({ payload } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }
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
