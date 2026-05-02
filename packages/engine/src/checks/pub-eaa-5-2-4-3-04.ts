import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'PuB-EAA-5.2.4.3-04';
const EVIDENCE_REF = 'eaa-payload';

/**
 * PuB-EAA-5.2.4.3-04: When `iss_reg_id` is present, its value must be
 * built per ETSI EN 319 412-1 clause 5.1.4 (the `organizationIdentifier`
 * format used in X.509 certificate subject DNs).
 *
 * The format is:
 *
 *   <3-letter scheme> <2-letter ISO-3166-1 alpha-2 country> [- <reference>]
 *
 * where the scheme is a registered identifier code such as VAT, NTR
 * (national trade register), PSD (PSD2 authorisation), LEI (legal
 * entity identifier), or other ETSI-registered codes. ETSI permits
 * either an immediate "-" before the reference or no separator
 * depending on scheme; we normalise to require a "-" because every
 * EU practice we have seen uses one and the reference is always
 * non-empty.
 */
export async function check(
  evidence: Evidence,
  scope: AssessmentScope,
): Promise<Verdict> {
  if (scope.tier !== 'pub-eaa') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: `Rule applies to PuB-EAA only; current tier is ${scope.tier}.`,
    };
  }
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
  if (!('iss_reg_id' in payload)) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'iss_reg_id claim absent. Format check has nothing to verify.',
    };
  }
  const value = payload['iss_reg_id'];
  if (typeof value !== 'string') {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `iss_reg_id is not a string; cannot evaluate ETSI EN 319 412-1 clause 5.1.4 format.`,
    };
  }
  const match = /^([A-Z]{3})([A-Z]{2})-(.+)$/.exec(value);
  if (!match) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `iss_reg_id "${value}" does not match the ETSI EN 319 412-1 clause 5.1.4 format <3-letter scheme><2-letter country>-<reference> (e.g. VATBE-1234567890).`,
    };
  }
  const [, scheme, country, reference] = match;
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `iss_reg_id "${value}" parses as scheme=${scheme}, country=${country}, reference=${reference}.`,
  };
}

export const controlId = CONTROL_ID;
