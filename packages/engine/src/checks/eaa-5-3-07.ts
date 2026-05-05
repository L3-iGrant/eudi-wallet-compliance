import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.3-07';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.3-07: When a subAttrs claim is present and a group carries an
 * attrs member, attrs must be a JSON Array. Empty arrays are permitted
 * but flagged as a warning since a subject grouping with no attributes
 * is rarely intentional.
 *
 * Returns N/A when subAttrs is absent or no group carries attrs.
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
  const groupsWithAttrs = groups.filter(
    (g) => typeof g === 'object' && g !== null && 'attrs' in (g as Record<string, unknown>),
  );
  if (groupsWithAttrs.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No subAttrs group carries an attrs member.',
    };
  }
  const issues: string[] = [];
  let emptyArrays = 0;
  for (let i = 0; i < groupsWithAttrs.length; i++) {
    const value = (groupsWithAttrs[i] as Record<string, unknown>)['attrs'];
    if (!Array.isArray(value)) {
      issues.push(`group #${i + 1}: attrs is ${describe(value)}, not a JSON array`);
    } else if (value.length === 0) {
      emptyArrays += 1;
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
  if (emptyArrays > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'warn',
      evidenceRef: EVIDENCE_REF,
      notes: `attrs is an empty JSON array in ${emptyArrays} group(s); a subject grouping with no attributes is rarely intentional.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `attrs is a non-empty JSON array in ${groupsWithAttrs.length} group(s).`,
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

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
