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

const CONTROL_ID = 'EAA-6.2.4.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.4.1-03: if NOT mDL, the EAA shall include the unicode form of
 * the issuing authority element from the 23220-2 namespace.
 *
 * Naming alignment with ISO/IEC 23220-2:
 *   - ISO/IEC 23220-2:2026 renamed the elements: the unicode-default
 *     element is `issuing_authority`; the latin1 variant is
 *     `issuing_authority_latin1`.
 *   - ETSI TS 119 472-1 v1.2.1 still uses the older 23220-2 name
 *     `issuing_authority_unicode`; that wording is outdated.
 *
 * To stay correct against the current ISO standard while remaining
 * tolerant of older issuers (and aligned with the still-referenced ETSI
 * wording), we accept EITHER element name on the 23220-2 namespace as
 * satisfying the requirement.
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
  if (isMdl(evidence.parsed)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'Rule applies only to non-mDL credentials.',
    };
  }
  const hasUnicode2026 = hasElement(evidence.parsed, NS_ISO_23220, 'issuing_authority');
  const hasUnicodeLegacy = hasElement(
    evidence.parsed,
    NS_ISO_23220,
    'issuing_authority_unicode',
  );
  if (!hasUnicode2026 && !hasUnicodeLegacy) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes:
        `Non-mDL is missing the unicode-form issuing authority element from "${NS_ISO_23220}". ` +
        `Per ISO/IEC 23220-2:2026 the element is "issuing_authority" (the latin1 variant is "issuing_authority_latin1"). ` +
        `Older issuers may use the ETSI TS 119 472-1 v1.2.1 name "issuing_authority_unicode"; either is accepted.`,
    };
  }
  const note = hasUnicode2026
    ? 'Non-mDL carries "issuing_authority" (ISO/IEC 23220-2:2026 unicode form).'
    : 'Non-mDL carries "issuing_authority_unicode" (legacy ETSI/older 23220-2 name); accepted.';
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: note,
  };
}

export const controlId = CONTROL_ID;
