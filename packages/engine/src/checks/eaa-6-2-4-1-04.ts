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

const CONTROL_ID = 'EAA-6.2.4.1-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.4.1-04: the unicode issuing authority element shall implement
 * clause 4.2.4 semantics. The element name changed across ISO/IEC
 * 23220-2 revisions (see EAA-6.2.4.1-03 for naming history). Structural
 * presence is enforced there; the semantic check (clause 4.2.4) is
 * deferred — the value content (string identifying the EAA Trust Service
 * Provider) is policy-driven.
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
      'Structural presence of the unicode issuing-authority element is covered by EAA-6.2.4.1-03 (accepts ISO/IEC 23220-2:2026 "issuing_authority" or the legacy "issuing_authority_unicode"); clause-4.2.4 semantic conformance is deferred.',
  };
}

export const controlId = CONTROL_ID;
