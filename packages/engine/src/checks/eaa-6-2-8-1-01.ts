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

const CONTROL_ID = 'EAA-6.2.8.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.8.1-01: shall not incorporate any data element implementing
 * audience semantics (clause 4.2.9.2). The mdoc spec doesn't define a
 * canonical audience element; we surface a fail when an element named
 * 'aud' or 'audience' is found in any namespace, and pass otherwise.
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
      if (item.elementIdentifier === 'aud' || item.elementIdentifier === 'audience') {
        return {
          controlId: CONTROL_ID,
          status: 'fail',
          evidenceRef: EVIDENCE_REF,
          notes: `Audience-shaped element ${item.elementIdentifier} found in "${ns}".`,
        };
      }
    }
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'No element named "aud" or "audience" found in any namespace.',
  };
}

export const controlId = CONTROL_ID;
