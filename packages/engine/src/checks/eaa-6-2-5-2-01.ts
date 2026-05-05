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

const CONTROL_ID = 'EAA-6.2.5.2-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.5.2-01: an mdoc EAA may contain also_known_as as the EAA
 * subject pseudonym, implementing clause 4.2.6.3 semantics. Permissive
 * rule; passes whether present or not. Type-check is delegated to -03.
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
  const aka = findElement(evidence.parsed, NS_ETSI, 'also_known_as');
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      aka === undefined
        ? 'also_known_as absent (optional).'
        : 'also_known_as present in the ETSI namespace.',
  };
}

export const controlId = CONTROL_ID;
