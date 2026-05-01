export interface AssessmentScope {
  module: string;
  profile: ('sd-jwt-vc' | 'mdoc')[];
  role: ('issuer' | 'verifier')[];
  tier: 'ordinary' | 'qeaa' | 'pub-eaa';
}

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
 * Placeholder shape; populated by the engine's gap analyser in a later
 * prompt. v0 returns an empty stub.
 */
export interface GapAnalysis {
  canBeQeaa: boolean;
  missingForQeaa: string[];
  canBePubEaa: boolean;
  missingForPubEaa: string[];
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
