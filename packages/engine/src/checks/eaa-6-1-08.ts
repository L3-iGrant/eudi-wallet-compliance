import type { ParsedEvidence } from '@iwc/shared';
import type { CheckExtras } from '../registry';
import type { AssessmentScope, Verdict } from '../types';
import {
  MDL_DOC_TYPE,
  NS_MDL,
  NS_ISO_23220,
  NS_ETSI,
  URN_QEAA,
  URN_PUB_EAA,
  isMdl,
  primaryNamespace,
  hasElement,
  findElement,
  findElementAnyNs,
} from './_mdoc';

const CONTROL_ID = 'EAA-6.1-08';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.1-08: encoding of any new tstr data element shall be Unicode
 * unless stated otherwise. CBOR tstr is defined as UTF-8, and cbor-x
 * decodes it as a JS string; we cannot meaningfully distinguish
 * intentional Unicode from a misencoded string after decoding. Deferred.
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
      'Encoding-level conformance of new tstr elements is deferred; cbor-x decodes tstr as UTF-8 and surfaces JS strings.',
  };
}

export const controlId = CONTROL_ID;
