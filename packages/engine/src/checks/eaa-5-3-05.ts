import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.3-05';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.3-05: When a sub_aka member is present under subAttrs, it must
 * be a JSON String holding the attribute-subject pseudonym. Returns
 * N/A when subAttrs is absent or no group contains sub_aka.
 */
export async function check(
  evidence: Evidence,
  _scope: AssessmentScope,
): Promise<Verdict> {
  if (!evidence.eaaPayload) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  let payload: Record<string, unknown>;
  try {
    ({ payload } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }
  if (!('subAttrs' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'subAttrs claim absent.',
    };
  }
  const groups = collectSubAttrs(payload['subAttrs']);
  const groupsWithSubAka = groups.filter(
    (g) => typeof g === 'object' && g !== null && 'sub_aka' in (g as Record<string, unknown>),
  );
  if (groupsWithSubAka.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'No subAttrs group contains a sub_aka member.',
    };
  }
  const issues: string[] = [];
  for (let i = 0; i < groupsWithSubAka.length; i++) {
    const value = (groupsWithSubAka[i] as Record<string, unknown>)['sub_aka'];
    if (typeof value !== 'string') {
      issues.push(`group #${i + 1}: sub_aka is ${describe(value)}, not a JSON string`);
    } else if (value.length === 0) {
      issues.push(`group #${i + 1}: sub_aka is an empty string`);
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
    notes: `sub_aka is a non-empty JSON string in ${groupsWithSubAka.length} group(s).`,
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
