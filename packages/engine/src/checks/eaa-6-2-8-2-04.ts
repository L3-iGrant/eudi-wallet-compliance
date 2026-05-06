import type { ParsedEvidence } from '@iwc/shared';
import type { CheckExtras } from '../registry';
import type { AssessmentScope, Verdict } from '../types';
import {
  MDL_DOC_TYPE,
  NS_MDL,
  NS_ISO_23220,
  NS_ETSI,
  isMdl,
  primaryNamespace,
  hasElement,
  findElement,
  findElementAnyNs,
} from './_mdoc';

const CONTROL_ID = 'EAA-6.2.8.2-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.8.2-04: oneTime present and true shall mean single-use, no
 * retention. Statement of semantics; the structural side is covered by
 * -03 (must be a bool). No additional structural verification.
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
  const oneTime = findElement(evidence.parsed, NS_ETSI, 'oneTime');
  if (oneTime === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'oneTime absent; rule applies only when present and true.',
    };
  }
  if (oneTime !== true) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'oneTime is not true; rule applies only when oneTime === true.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      'oneTime is true; single-use, no-retention semantic obligation falls on consumers.',
  };
}

export const controlId = CONTROL_ID;
