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

const CONTROL_ID = 'EAA-6.2.8.2-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.8.2-03: oneTime shall have CBOR bool type. The parser exposes
 * cbor-x's native decode; CBOR bool surfaces as JS boolean, while
 * encoded-as-int / encoded-as-string variants surface as number / string.
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
      notes: 'oneTime absent; rule applies only when present.',
    };
  }
  if (typeof oneTime !== 'boolean') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `oneTime is present but not a CBOR bool (got ${typeof oneTime}).`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `oneTime is a CBOR bool (${oneTime}).`,
  };
}

export const controlId = CONTROL_ID;
