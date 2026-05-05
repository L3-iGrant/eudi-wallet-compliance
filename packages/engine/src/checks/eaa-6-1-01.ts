import type { ParsedEvidence } from '@iwc/shared';
import type { CheckExtras } from '../registry';
import type { AssessmentScope, Verdict } from '../types';

const CONTROL_ID = 'EAA-6.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.1-01: data structures of the EAA shall be those of ISO/IEC 18013-5
 * extended per the present document. Reaching this branch with a parsed
 * mdoc proves the IssuerSigned-shaped substrate; parseMdoc enforces the
 * outer map keys, the COSE_Sign1 four-tuple, and the tag(24)-wrapped MSO,
 * so a parse-success implies clause 6.1.01 is satisfied.
 */
export async function check(
  evidence: ParsedEvidence,
  _scope: AssessmentScope,
  _extras: CheckExtras,
): Promise<Verdict> {
  if (evidence.kind !== 'mdoc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to mdoc evidence only.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'Payload parses as the IssuerSigned shape defined in ISO/IEC 18013-5.',
  };
}

export const controlId = CONTROL_ID;
