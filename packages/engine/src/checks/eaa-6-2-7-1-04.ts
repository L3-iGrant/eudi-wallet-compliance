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

const CONTROL_ID = 'EAA-6.2.7.1-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.7.1-04: validFrom and validUntil shall have seconds precision.
 * Detected via getMilliseconds(): a date with millisecond > 0 indicates
 * sub-second precision was encoded.
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
  const msFrom = validFrom.getMilliseconds();
  const msUntil = validUntil.getMilliseconds();
  if (msFrom !== 0 || msUntil !== 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `validFrom millis=${msFrom}, validUntil millis=${msUntil}; expected 0 for seconds precision.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'validFrom and validUntil expressed at seconds precision.',
  };
}

export const controlId = CONTROL_ID;
