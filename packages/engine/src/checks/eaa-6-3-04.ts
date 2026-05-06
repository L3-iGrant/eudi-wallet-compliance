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

const CONTROL_ID = 'EAA-6.3-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.3-04: subId shall be a CBOR map. We check every SubAttr's
 * subId is a plain object (cbor-x's mapsAsObjects:true representation
 * of a CBOR map).
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
      if (!('subId' in obj)) continue;
      inspected += 1;
      const subId = obj.subId;
      if (subId === null || typeof subId !== 'object' || Array.isArray(subId)) {
        violations.push(`${ns}:${item.elementIdentifier}`);
      }
    }
  }
  if (inspected === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No subId-shaped SubAttr values present.',
    };
  }
  if (violations.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `subId is not a CBOR map at: ${violations.join(', ')}.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'All subId members are CBOR maps.',
  };
}

export const controlId = CONTROL_ID;
