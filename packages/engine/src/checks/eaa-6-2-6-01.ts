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

const CONTROL_ID = 'EAA-6.2.6-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.6-01: an mdoc EAA shall incorporate the issue_date data
 * element in the appropriate primary namespace.
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
  const ns = primaryNamespace(evidence.parsed);
  if (!hasElement(evidence.parsed, ns, 'issue_date')) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `issue_date missing from "${ns}" namespace.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `issue_date present in "${ns}".`,
  };
}

export const controlId = CONTROL_ID;
