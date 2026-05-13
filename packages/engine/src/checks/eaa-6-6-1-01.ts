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

const CONTROL_ID = 'EAA-6.6.1-01';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.6.1-01: shall be signed by a CB-AdES digital signature. CB-AdES
 * sits on top of COSE_Sign1 (RFC 9052). parseMdoc enforces the four-
 * element COSE_Sign1 array on the outer envelope; reaching this with a
 * parsed mdoc proves the wrapper shape. Cryptographic verification of
 * the AdES extension is deferred (warn).
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
  if (
    !(evidence.parsed.issuerAuth.signature instanceof Uint8Array) ||
    evidence.parsed.issuerAuth.signature.length === 0
  ) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'COSE_Sign1 signature is missing or empty. Per RFC 9052 §4.2, the signature field is the fourth element of the COSE_Sign1 structure (a CBOR byte string carrying the bytes produced by the signing algorithm). An empty byte string indicates the credential was emitted unsigned or with the signature stripped; a verifier cannot establish issuer authenticity.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'warn',
    evidenceRef: EVIDENCE_REF,
    notes:
      'COSE_Sign1 wrapper shape is well-formed. Cryptographic verification of the CB-AdES extension is deferred until trust-list integration lands.',
  };
}

export const controlId = CONTROL_ID;
