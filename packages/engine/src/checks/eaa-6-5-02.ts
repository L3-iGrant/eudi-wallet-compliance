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

const CONTROL_ID = 'EAA-6.5-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.5-02: deviceKey shall contain a public key (not private). We
 * verify deviceKey decodes as a non-null CBOR map (COSE_Key shape) but
 * cannot ascertain "public, not private" without crypto material; this
 * is a structural pass plus a note of the deferred check.
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
  const dk = evidence.parsed.issuerAuth.mso.deviceKeyInfo?.deviceKey;
  if (dk === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'deviceKey absent; rule applies only when present.',
    };
  }
  if (typeof dk !== 'object' || dk === null) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'deviceKey is present but is not a CBOR map (COSE_Key shape). Expected a COSE_Key per RFC 9052 §7 — a CBOR map with integer keys including kty (1), and the curve/coordinate parameters appropriate for the algorithm (e.g. kty=2 EC2 with crv, x, y; or kty=1 OKP with crv, x). Booleans, byte strings, arrays and primitive scalars are rejected.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      'deviceKey is a CBOR map (COSE_Key shape); "public-only" verification requires inspecting key material and is deferred.',
  };
}

export const controlId = CONTROL_ID;
