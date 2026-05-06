import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from './types';

/**
 * A check function takes the parsed EAA payload (decoded once by
 * runAssessment), the active AssessmentScope, and any unparsed
 * accompanying evidence inputs (issuer cert PEM, status list URL
 * override, type metadata document). It returns a Verdict for a single
 * control. Always async: structural checks resolve immediately, while
 * resolver checks (status list, trust list) await network I/O.
 * runAssessment fans them out via Promise.all.
 *
 * Phase 7 split: the EAA payload is parsed once in runAssessment into
 * a tagged union (`sd-jwt-vc` or `mdoc`) and the parsed shape is passed
 * here as `evidence`. Each check narrows on `evidence.kind` and returns
 * na for payloads outside its profile. Side-channel inputs that some
 * checks still need (statusListUrl, issuerCert, typeMetadata) live on
 * the third `extras` argument so the parsed-vs-unparsed split stays
 * clear.
 *
 * Most checks ignore scope; checks that need it (e.g. the cross-cutting
 * shortLived / status mutex, which behaves differently for QEAA and
 * PuB-EAA) read scope.tier.
 */
export type CheckFunction = (
  evidence: ParsedEvidence,
  scope: AssessmentScope,
  extras: CheckExtras,
) => Promise<Verdict>;

/**
 * Unparsed evidence inputs that complement the parsed EAA payload.
 * Raw issuerCert PEM, statusListUrl override (used by the runtime
 * resolver), and the optional typeMetadata JSON document.
 */
export type CheckExtras = Pick<
  Evidence,
  'issuerCert' | 'statusListUrl' | 'typeMetadata'
>;

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
