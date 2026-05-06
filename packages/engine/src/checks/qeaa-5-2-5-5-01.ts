import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'QEAA-5.2.5.5-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * QEAA-5.2.5.5-01: In a SD-JWT VC QEAA, all attributes must refer to
 * the EAA subject. The subAttrs claim (clause 5.3) is the mechanism
 * for grouping attributes that refer to a different entity, so its
 * presence directly contradicts this rule.
 *
 * Tier-gated: the check is N/A for non-QEAA scopes so a single
 * shared evidence file can be assessed against multiple tiers
 * without spurious failures.
 */
export async function check(
  evidence: ParsedEvidence,
  scope: AssessmentScope,
  extras: CheckExtras,
): Promise<Verdict> {
  if (scope.tier !== 'qeaa') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: `Rule applies to QEAA only; current tier is ${scope.tier}.`,
    };
  }
  if (evidence.kind !== 'sd-jwt-vc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to SD-JWT VC evidence only.',
    };
  }
  const { payload } = evidence.parsed;
  if ('subAttrs' in payload) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes:
        'QEAA payload contains the subAttrs claim, which groups attributes that refer to entities other than the subject. A QEAA must carry only subject-attributes.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'No subAttrs claim; all attributes are scoped to the EAA subject.',
  };
}

export const controlId = CONTROL_ID;
