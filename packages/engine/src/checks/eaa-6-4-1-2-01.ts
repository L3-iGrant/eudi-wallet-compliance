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

const CONTROL_ID = 'EAA-6.4.1.2-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.4.1.2-01: an mdoc EAA shall include the version component
 * within MobileSecurityObject.
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
  const v = evidence.parsed.issuerAuth.mso.version;
  if (typeof v !== 'string' || v.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'MobileSecurityObject.version is missing or is not a non-empty CBOR text string (tstr). Per ISO/IEC 18013-5 §9.1.2.4, every MSO must carry a version member (e.g. "1.0") to identify the MSO format revision. Encode it as a CBOR text string under the "version" key inside the MSO.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `MobileSecurityObject.version = "${v}".`,
  };
}

export const controlId = CONTROL_ID;
