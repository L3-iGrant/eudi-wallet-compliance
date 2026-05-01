import type { AssessmentScope, Evidence, Verdict } from './types';

/**
 * A check function takes the supplied Evidence plus the active
 * AssessmentScope and returns a Verdict for a single control. Always async:
 * structural checks resolve immediately, while resolver checks (status
 * list, trust list) await network I/O. runAssessment fans them out via
 * Promise.all.
 *
 * Most checks ignore scope; checks that need it (e.g. the cross-cutting
 * shortLived / status mutex, which behaves differently for QEAA and
 * PuB-EAA) read scope.tier.
 */
export type CheckFunction = (
  evidence: Evidence,
  scope: AssessmentScope,
) => Promise<Verdict>;

/**
 * Mutable registry, keyed by canonical control id (e.g. "EAA-5.2.10.1-04").
 * Populated by check-pack registrations in checks/index.ts.
 */
export const checkRegistry: Record<string, CheckFunction> = {};

export function registerCheck(controlId: string, fn: CheckFunction): void {
  checkRegistry[controlId] = fn;
}

export function getCheck(controlId: string): CheckFunction | undefined {
  return checkRegistry[controlId];
}
