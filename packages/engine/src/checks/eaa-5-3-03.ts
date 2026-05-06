import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.3-03';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.3-03: When a subAttrs claim is present, it must contain exactly
 * one of sub_id (subject identifier) or sub_aka (subject pseudonym).
 * Returns N/A when subAttrs is absent.
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
      notes: 'subAttrs is present but is not a JSON object or array of objects.',
    };
  }
  const issues: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i] as Record<string, unknown>;
    const hasId = 'sub_id' in g;
    const hasAka = 'sub_aka' in g;
    if (hasId && hasAka) {
      issues.push(`group #${i + 1}: both sub_id and sub_aka present (only one permitted)`);
    } else if (!hasId && !hasAka) {
      issues.push(`group #${i + 1}: neither sub_id nor sub_aka present`);
    }
  }
  if (issues.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: issues.join('; '),
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `subAttrs has exactly one of sub_id/sub_aka in each of ${groups.length} group(s).`,
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
