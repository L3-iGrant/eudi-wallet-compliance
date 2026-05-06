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
import { normaliseStatus } from './_status';

const CONTROL_ID = 'EAA-6.4.1.3-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.4.1.3-01: an mdoc with disclosable attributes shall include
 * each disclosure in IssuerSignedItem. Same shape as §6.3-01; passes
 * when at least one IssuerSignedItem exists.
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
  const totalItems = Object.values(evidence.parsed.nameSpaces).reduce(
    (sum, items) => sum + items.length,
    0,
  );
  return {
    controlId: CONTROL_ID,
    status: totalItems > 0 ? 'pass' : 'fail',
    evidenceRef: EVIDENCE_REF,
    notes:
      totalItems > 0
        ? `${totalItems} IssuerSignedItem disclosure(s) present.`
        : 'No IssuerSignedItem disclosures present.',
  };
}

export const controlId = CONTROL_ID;
