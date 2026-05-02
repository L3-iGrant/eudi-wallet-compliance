import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.4.1.5-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.5-02: If the SD-JWT VC EAA contains one or more disclosures,
 * the `_sd_alg` component shall be present in the payload.
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
  let disclosures: string[];
  try {
    ({ payload, disclosures } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }
  if (disclosures.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'EAA carries no disclosures; rule applies only when one or more disclosures are present.',
    };
  }
  if (payload['_sd_alg'] === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA carries ${disclosures.length} disclosure(s) but payload._sd_alg is missing.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'payload._sd_alg present alongside disclosures.',
  };
}

export const controlId = CONTROL_ID;
