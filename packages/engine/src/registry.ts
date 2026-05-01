import type { Evidence, Verdict } from './types';

/**
 * A check function takes the supplied Evidence and returns a Verdict for
 * a single control. Pure, synchronous, no I/O. Network-bound checks (e.g.
 * status list resolution) are layered on top and pass their results
 * through Evidence rather than performing fetches inside the check.
 */
export type CheckFunction = (evidence: Evidence) => Verdict;

/**
 * Mutable registry, keyed by canonical control id (e.g. "EAA-5.2.10.1-04").
 * Populated by check-pack registrations in subsequent prompts.
 */
export const checkRegistry: Record<string, CheckFunction> = {};

export function registerCheck(controlId: string, fn: CheckFunction): void {
  checkRegistry[controlId] = fn;
}

export function getCheck(controlId: string): CheckFunction | undefined {
  return checkRegistry[controlId];
}
