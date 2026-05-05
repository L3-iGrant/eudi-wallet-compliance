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

const CONTROL_ID = 'PuB-EAA-6.2.5.6-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * PuB-EAA-6.2.5.6-01: in an mdoc PuB-EAA all attributes shall refer to
 * the EAA subject. Same shape as QEAA-6.2.5.5-01; tier-gated.
 */
export async function check(
  evidence: ParsedEvidence,
  scope: AssessmentScope,
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
  if (scope.tier !== 'pub-eaa') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only when scope.tier is pub-eaa.',
    };
  }
  const violations: string[] = [];
  for (const [ns, items] of Object.entries(evidence.parsed.nameSpaces)) {
    for (const item of items) {
      const v = item.elementValue;
      if (
        v !== null &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        ('subId' in (v as object) || 'subAka' in (v as object))
      ) {
        violations.push(`${ns}:${item.elementIdentifier}`);
      }
    }
  }
  if (violations.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `PuB-EAA carries SubAttr-shaped values referring to non-subject entities: ${violations.join(', ')}.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'No SubAttr-shaped values detected; all attributes appear to refer to the EAA subject.',
  };
}

export const controlId = CONTROL_ID;
