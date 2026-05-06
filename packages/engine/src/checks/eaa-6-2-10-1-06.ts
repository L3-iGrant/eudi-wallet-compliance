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

const CONTROL_ID = 'EAA-6.2.10.1-06';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-6.2.10.1-06 (synthetic): when status is present, the purpose
 * member shall be present. Mirrors §5.2.10.1-06; IETF tolerance applies.
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
  const status = evidence.parsed.issuerAuth.mso.status;
  if (status === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component absent; rule applies only when present.',
    };
  }
  const ns = normaliseStatus({ status });
  if (ns.shape === 'invalid') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component is present but not a JSON object.',
    };
  }
  if (ns.shape === 'ietf-nested') {
    return {
      controlId: CONTROL_ID,
      status: 'pass',
      evidenceRef: EVIDENCE_REF,
      notes:
        'status uses the IETF Token Status List nested envelope; the IETF draft does not define a purpose member, so its absence is accepted.',
    };
  }
  if (ns.purpose === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status object is missing the purpose member.',
    };
  }
  if (typeof ns.purpose !== 'string' || ns.purpose.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.purpose is present but not a non-empty string.',
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `status.purpose present: "${ns.purpose}".`,
  };
}

export const controlId = CONTROL_ID;
