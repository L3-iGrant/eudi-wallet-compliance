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

const CONTROL_ID = 'EAA-6.2.12-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.12-05: shortLived false or absent requires revocation check.
 * Cross-cutting with EAA-4.2.11.1-03. Pass when shortLived is absent
 * or false; the revocation-required obligation is enforced through
 * the §6.2.10 status rules and the cross-cutting clause-4 mutex.
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
  const sl = findElement(evidence.parsed, NS_ETSI, 'shortLived');
  if (sl === undefined || sl === false) {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        sl === undefined
          ? 'shortLived absent; revocation check obligation governed by §6.2.10 / §4.2.11.1.'
          : 'shortLived is false; revocation check obligation governed by §6.2.10 / §4.2.11.1.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'na',
    evidenceRef: EVIDENCE_REF,
    notes: 'shortLived is true; -04 governs.',
  };
}

export const controlId = CONTROL_ID;
