import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.3-06';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.3-06: When a subAttrs claim is present, every group must include
 * the attrs member. Returns N/A when subAttrs is absent.
 */
export async function check(
  evidence: ParsedEvidence,
  _scope: AssessmentScope,
  _extras: CheckExtras,
): Promise<Verdict> {
  if (evidence.kind !== 'sd-jwt-vc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to SD-JWT VC evidence only.',
    };
  }
  const { payload } = evidence.parsed;
  if (!('subAttrs' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'subAttrs claim absent.',
    };
  }
  const groups = collectSubAttrs(payload['subAttrs']);
  if (groups.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'subAttrs is present but is not a JSON object or an array of objects. Expected either a single attribute group (a JSON object carrying sub_id/sub_aka plus an attrs map) or an array of such groups.',
    };
  }
  const missing: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    if (!('attrs' in (groups[i] as Record<string, unknown>))) {
      missing.push(`group #${i + 1}`);
    }
  }
  if (missing.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `attrs member is missing from: ${missing.join(', ')}. Every subAttrs group must carry an attrs object listing the selectively-disclosable claims grouped under that subject identifier.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `attrs member present in ${groups.length} group(s).`,
  };
}

function collectSubAttrs(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === 'object' && v !== null && !Array.isArray(v));
  }
  if (typeof value === 'object' && value !== null) {
    return [value];
  }
  return [];
}

export const controlId = CONTROL_ID;
