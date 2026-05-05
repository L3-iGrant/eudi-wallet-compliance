export interface AssessmentScope {
  module: string;
  profile: ('sd-jwt-vc' | 'mdoc')[];
  role: ('issuer' | 'verifier')[];
  tier: 'ordinary' | 'qeaa' | 'pub-eaa';
}

/**
 * Raw assessment inputs as they arrive from the upload form / API caller.
 *
 * `eaaPayload` is the raw string the user supplied (SD-JWT VC compact
 * serialisation today; mdoc CBOR base64 from Phase 7 onwards). It is
 * parsed once inside runAssessment, into a `ParsedEvidence` tagged union
 * (see `@iwc/shared`), before being dispatched to per-control check
 * functions; checks never re-parse the payload. The other fields
 * (`issuerCert`, `statusListUrl`, `typeMetadata`) stay on this raw
 * shape and are passed to checks via the third `extras` argument of
 * the CheckFunction signature.
 */
export interface Evidence {
  eaaPayload?: string;
  issuerCert?: string;
  statusListUrl?: string;
  typeMetadata?: object;
}

export type VerdictStatus = 'pass' | 'fail' | 'warn' | 'na';

export interface Verdict {
  controlId: string;
  status: VerdictStatus;
  evidenceRef: string;
  notes: string;
}

export interface AssessmentSummary {
  pass: number;
  fail: number;
  warn: number;
  na: number;
}

/**
 * Tier-promotion gap analysis. Two complementary signals per higher tier:
 *
 *  - `missingForX`: every control that **fails** when the same evidence is
 *    re-run at tier X. Captures behaviour-aware checks like the
 *    shortLived/status mutex which flips between tiers even when the
 *    catalogue's `applies_to` set does not change.
 *  - `additionallyRequiredForX`: controls whose catalogue `applies_to`
 *    includes tier X but **not** the current tier (the upgrade delta) and
 *    which the current verdicts do not show as `pass`. Useful for
 *    "what new things must I do" framing.
 *
 *  - `canBeX`: convenience boolean, true iff `missingForX` is empty.
 */
export interface GapAnalysis {
  canBeQeaa: boolean;
  missingForQeaa: string[];
  additionallyRequiredForQeaa: string[];
  canBePubEaa: boolean;
  missingForPubEaa: string[];
  additionallyRequiredForPubEaa: string[];
}

export interface AssessmentResult {
  reportId: string;
  /**
   * Tenant the assessment was attributed to. Defaults to 'public-default'
   * for the free Self-Assessment runner. Plumbed through from
   * runAssessment options for the future Workspace SaaS.
   */
  tenantId: string;
  scope: AssessmentScope;
  /** Names of the Evidence keys that were supplied (e.g. 'eaaPayload'). */
  evidenceRefs: string[];
  verdicts: Verdict[];
  summary: AssessmentSummary;
  gapAnalysis: GapAnalysis;
  /** ISO 8601 timestamp at which the assessment was run. */
  createdAt: string;
}
