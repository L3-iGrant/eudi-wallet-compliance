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

const CONTROL_ID = 'EAA-6.4.1.4-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.4.1.4-02: an mdoc with selectively-disclosable attributes shall
 * include valueDigests in MobileSecurityObject. Pass when valueDigests
 * is present and non-empty.
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
  const vd = evidence.parsed.issuerAuth.mso.valueDigests;
  const namespaces = Object.keys(vd);
  if (namespaces.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'MobileSecurityObject.valueDigests is missing or empty. Per ISO/IEC 18013-5 §9.1.2.5, an mdoc with selectively-disclosable attributes must carry valueDigests as a CBOR map keyed by namespace, where each value is itself a CBOR map of digestID → digest bytes for every IssuerSignedItem. Without it, verifiers have no commitments to validate disclosed items against.',
    };
  }
  const total = namespaces.reduce(
    (sum, ns) => sum + Object.keys(vd[ns] ?? {}).length,
    0,
  );
  if (total === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'MobileSecurityObject.valueDigests declares namespaces but contains no digest entries. Each inner namespace map must list at least one digestID → digest entry, matching the IssuerSignedItem digests for that namespace. An empty digest map cannot commit to any disclosable attribute.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `valueDigests carries ${total} digest(s) across ${namespaces.length} namespace(s).`,
  };
}

export const controlId = CONTROL_ID;
