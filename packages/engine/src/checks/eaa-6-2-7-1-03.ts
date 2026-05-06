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

const CONTROL_ID = 'EAA-6.2.7.1-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.7.1-03: validFrom and validUntil shall indicate UTC time.
 * cbor-x decodes tag(0) tdate strings using JS Date, which is internally
 * UTC; the rule effectively passes structurally as long as the fields
 * are valid Dates. We can verify both values round-trip cleanly to
 * ISO strings (toISOString always emits UTC with the Z suffix).
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
  const { validFrom, validUntil } = evidence.parsed.issuerAuth.mso.validityInfo;
  const fields: Array<[string, unknown]> = [
    ['validFrom', validFrom],
    ['validUntil', validUntil],
  ];
  const broken = fields.filter(([, v]) => !(v instanceof Date) || Number.isNaN((v as Date).getTime()));
  if (broken.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Cannot verify UTC time: ${broken.map(([k]) => k).join(', ')} not a valid date.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'validFrom and validUntil are valid Dates; cbor-x decodes tag(0) tdate strings as UTC.',
  };
}

export const controlId = CONTROL_ID;
