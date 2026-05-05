import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.4.1.4-02';
const EVIDENCE_REF = 'eaa-payload';

/**
 * EAA-5.4.1.4-02: An SD-JWT VC EAA that makes individual elements of
 * JSON arrays selectively disclosable shall represent each such
 * disclosable element with the placeholder object specified in IETF
 * SD-JWT clause 4.2.2:
 *
 *   { "...": "<base64url-encoded disclosure digest>" }
 *
 * The placeholder is an object with exactly one member named "..."
 * whose value is a string. Any object that has a "..." key but
 * additional members, or where "..." is not a string, is malformed.
 *
 * Returns:
 *   pass: at least one valid placeholder found and every placeholder
 *         is well-formed
 *   na:   no placeholders anywhere in the payload (the EAA does not
 *         use array-element disclosures)
 *   fail: at least one malformed placeholder
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

  const issues: string[] = [];
  let placeholderCount = 0;

  function walk(node: unknown, path: string): void {
    if (Array.isArray(node)) {
      node.forEach((child, i) => walk(child, `${path}[${i}]`));
      return;
    }
    if (typeof node !== 'object' || node === null) return;
    const obj = node as Record<string, unknown>;
    if ('...' in obj) {
      placeholderCount += 1;
      const keys = Object.keys(obj);
      if (keys.length !== 1) {
        issues.push(
          `${path}: array-element placeholder has ${keys.length} keys (${keys.map((k) => JSON.stringify(k)).join(', ')}); expected only "..."`,
        );
      }
      if (typeof obj['...'] !== 'string') {
        issues.push(
          `${path}: "..." value is ${describe(obj['...'])}, expected a base64url string digest`,
        );
      } else if (obj['...'].length === 0) {
        issues.push(`${path}: "..." value is an empty string`);
      }
      return;
    }
    for (const k of Object.keys(obj)) {
      walk(obj[k], path ? `${path}.${k}` : k);
    }
  }

  walk(payload, '$');

  if (placeholderCount === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'EAA payload contains no array-element disclosure placeholders.',
    };
  }
  if (issues.length > 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `Malformed array-element disclosure(s): ${issues.join('; ')}`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `${placeholderCount} array-element disclosure placeholder(s) all well-formed.`,
  };
}

function describe(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'an array';
  return typeof v;
}

export const controlId = CONTROL_ID;
