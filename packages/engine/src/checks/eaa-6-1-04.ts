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

const CONTROL_ID = 'EAA-6.1-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.1-04: data elements defined in this document shall be assigned
 * the namespace "org.etsi.01947201.010101". Detect the negative case:
 * a namespace whose identifier starts with "org.etsi." but is not the
 * canonical one. We cannot positively verify "every new element" is in
 * the right namespace without an external taxonomy of "new elements".
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
  const stray = Object.keys(evidence.parsed.nameSpaces).filter(
    (ns) => ns.startsWith('org.etsi.') && ns !== NS_ETSI,
  );
  if (stray.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Found ETSI-prefixed namespace(s) outside the canonical "${NS_ETSI}": ${stray.join(', ')}.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes:
      'No ETSI-prefixed namespaces other than the canonical one. Comprehensive verification of "every new element is in the ETSI namespace" requires a taxonomy lookup and is deferred.',
  };
}

export const controlId = CONTROL_ID;
