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

const CONTROL_ID = 'EAA-6.2.7.1-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.7.1-05: validFrom and validUntil shall not contain fractions
 * of seconds. Same structural test as -04 (millisecond component must
 * be 0); duplicated as a separate verdict so reports surface both rules.
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
  const { validFrom, validUntil } = evidence.parsed.issuerAuth.mso.validityInfo;
  if (!(validFrom instanceof Date) || !(validUntil instanceof Date)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'validFrom or validUntil missing; rule is na.',
    };
  }
  if (validFrom.getMilliseconds() !== 0 || validUntil.getMilliseconds() !== 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'validFrom or validUntil carries non-zero fractional-seconds component.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'No fractional-seconds component on validFrom or validUntil.',
  };
}

export const controlId = CONTROL_ID;
