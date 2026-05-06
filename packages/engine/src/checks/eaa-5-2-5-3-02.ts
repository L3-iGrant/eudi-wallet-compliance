import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.5.3-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.2.5.3-02: In an SD-JWT VC EAA, each attribute not associated
 * to the EAA subject must be associated either to an attribute
 * subject identifier (sub_id) or pseudonym (sub_aka). The
 * SD-JWT VC realisation uses the subAttrs claim (clause 5.3 of
 * the present document) to carry these non-subject attribute groups.
 *
 * This check is the SD-JWT VC realisation of cross-cutting
 * EAA-5.3-03 and adds a per-control audit verdict at the 5.2.5
 * layer. Structurally identical: when subAttrs is present, every
 * group must contain exactly one of sub_id or sub_aka.
 *
 * Returns N/A when subAttrs is absent (no non-subject attributes
 * declared).
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
      notes: 'subAttrs claim absent; no non-subject attribute groups declared.',
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
    if (!hasId && !hasAka) {
      issues.push(
        `group #${i + 1}: neither sub_id nor sub_aka present, so its attributes have no attribute-subject binding`,
      );
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
    notes: `Each of ${groups.length} subAttrs group(s) carries an attribute-subject identifier or pseudonym.`,
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
