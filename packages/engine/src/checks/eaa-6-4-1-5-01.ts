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

const CONTROL_ID = 'EAA-6.4.1.5-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.4.1.5-01: an mdoc with disclosable attributes shall include
 * digestAlgorithm in MobileSecurityObject.
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
  const da = evidence.parsed.issuerAuth.mso.digestAlgorithm;
  if (typeof da !== 'string' || da.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'MobileSecurityObject.digestAlgorithm is missing or is not a non-empty CBOR text string (tstr). Per ISO/IEC 18013-5 §9.1.2.5, the MSO must declare the hash algorithm used to compute the valueDigests entries — an IANA Named Information Hash Algorithm Registry name such as "SHA-256", "SHA-384", or "SHA-512". Add the "digestAlgorithm" member to the MSO with one of those values.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `MobileSecurityObject.digestAlgorithm = "${da}".`,
  };
}

export const controlId = CONTROL_ID;
