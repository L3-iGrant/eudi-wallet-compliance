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

const CONTROL_ID = 'QEAA-6.6.2-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * QEAA-6.6.2-03: digest algorithm in x5t shall be SHA-256. RFC 9360
 * x5t encodes as [alg, hash]; the parser currently exposes only the
 * hash bytes (alg dropped during decode). Verification of the algo
 * field is therefore deferred to a parser extension.
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
  if (scope.tier !== 'qeaa') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only when scope.tier is qeaa.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'na',
    evidenceRef: EVIDENCE_REF,
    notes:
      'x5t algorithm field is dropped by the current parser; verification of "SHA-256" is deferred to a parser extension.',
  };
}

export const controlId = CONTROL_ID;
