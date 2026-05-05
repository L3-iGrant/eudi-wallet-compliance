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

const CONTROL_ID = 'EAA-6.3-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.3-03: SubAttr instance shall have either subId or subAka. We
 * walk every IssuerSignedItem.elementValue and, where it is shaped like
 * a SubAttr (a CBOR map), assert exactly one of the two members is
 * present.
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
  const violations: string[] = [];
  let inspected = 0;
  for (const [ns, items] of Object.entries(evidence.parsed.nameSpaces)) {
    for (const item of items) {
      const v = item.elementValue;
      if (v === null || typeof v !== 'object' || Array.isArray(v)) continue;
      const obj = v as Record<string, unknown>;
      const hasSubId = 'subId' in obj;
      const hasSubAka = 'subAka' in obj;
      if (!hasSubId && !hasSubAka) continue;
      inspected += 1;
      if (hasSubId === hasSubAka) {
        violations.push(`${ns}:${item.elementIdentifier} carries both subId and subAka`);
      }
    }
  }
  if (inspected === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No SubAttr-shaped values present; rule applies only when SubAttr is used.',
    };
  }
  if (violations.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `SubAttr instance violates the subId-xor-subAka rule: ${violations.join('; ')}.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `${inspected} SubAttr instance(s) each carry exactly one of subId or subAka.`,
  };
}

export const controlId = CONTROL_ID;
