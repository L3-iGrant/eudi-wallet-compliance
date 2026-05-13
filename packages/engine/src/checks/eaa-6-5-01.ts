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

const CONTROL_ID = 'EAA-6.5-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.5-01: shall incorporate deviceKey within deviceKeyInfo of MSO.
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
  const dki = evidence.parsed.issuerAuth.mso.deviceKeyInfo;
  if (dki === undefined || dki === null || dki.deviceKey === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'MobileSecurityObject.deviceKeyInfo.deviceKey is missing. Per ISO/IEC 18013-5 §9.1.2.4, an mdoc EAA must commit to the holder\'s device-binding public key by carrying deviceKey inside deviceKeyInfo. Encode it as a COSE_Key (RFC 9052 §7) — a CBOR map with kty (1), crv (-1 for EC2/OKP) and the coordinate parameters appropriate for the algorithm — under deviceKeyInfo.deviceKey in the MSO.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'MobileSecurityObject.deviceKeyInfo.deviceKey is present.',
  };
}

export const controlId = CONTROL_ID;
