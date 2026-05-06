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

const CONTROL_ID = 'QEAA-6.6.2-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * QEAA-6.6.2-02: COSE protected header of an mdoc QEAA shall contain
 * x5u and x5t header parameters per RFC 9360.
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
  const ph = evidence.parsed.issuerAuth.protectedHeader;
  const missing: string[] = [];
  if (!ph.x5u) missing.push('x5u');
  if (!ph.x5t) missing.push('x5t');
  if (missing.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `QEAA protected header is missing: ${missing.join(', ')}.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'QEAA protected header carries x5u and x5t.',
  };
}

export const controlId = CONTROL_ID;
