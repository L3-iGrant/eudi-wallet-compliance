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

const CONTROL_ID = 'EAA-6.2.9-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.9-01: an mdoc EAA shall not incorporate any data element
 * implementing clause 4.2.10 (attributes evidence) semantics. The spec
 * doesn't define a canonical element name; we look for known SD-JWT VC
 * shape names ('evidence' and 'attributes_evidence') across all
 * namespaces.
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
  for (const [ns, items] of Object.entries(evidence.parsed.nameSpaces)) {
    for (const item of items) {
      if (
        item.elementIdentifier === 'evidence' ||
        item.elementIdentifier === 'attributes_evidence'
      ) {
        return {
          controlId: CONTROL_ID,
          status: 'fail',
          evidenceRef: EVIDENCE_REF,
          notes: `Attributes-evidence-shaped element ${item.elementIdentifier} found in "${ns}".`,
        };
      }
    }
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'No element named "evidence" or "attributes_evidence" found in any namespace.',
  };
}

export const controlId = CONTROL_ID;
