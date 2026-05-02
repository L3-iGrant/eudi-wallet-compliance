import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.4.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.4.1-01: When the `issuing_authority` claim is present, it
 * must be a JSON String containing the name of the EAA issuer (per
 * CIR (EU) 2024/2977 Annex I, Table 5).
 *
 * The catalogue declares this rule at `may` level so absence is N/A,
 * not fail. This check fires only when the claim is present and
 * verifies it's a non-empty string.
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
  if (!('issuing_authority' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'issuing_authority claim absent.',
    };
  }
  const value = payload['issuing_authority'];
  if (typeof value !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `issuing_authority is ${describe(value)}, not a JSON string.`,
    };
  }
  if (value.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'issuing_authority is an empty string.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `issuing_authority is a non-empty JSON string ("${value.slice(0, 80)}").`,
  };
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
