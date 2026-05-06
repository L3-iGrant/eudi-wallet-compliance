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

const CONTROL_ID = 'EAA-6.4.1.4-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.4.1.4-01: valueDigests shall implement clause 4.4.2.3
 * semantics. Structural presence and shape covered by -02 plus
 * the parser; semantic conformance to clause 4.4.2.3 deferred.
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
  return {
    controlId: CONTROL_ID,
    status: 'na',
    evidenceRef: EVIDENCE_REF,
    notes:
      'Structural presence is covered by EAA-6.4.1.4-02; clause-4.4.2.3 semantic conformance is deferred.',
  };
}

export const controlId = CONTROL_ID;
