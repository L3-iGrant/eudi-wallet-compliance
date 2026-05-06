import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.4.1.5-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.5-02: If the SD-JWT VC EAA contains one or more disclosures,
 * the `_sd_alg` component shall be present in the payload.
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
  const { payload, disclosures } = evidence.parsed;
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
