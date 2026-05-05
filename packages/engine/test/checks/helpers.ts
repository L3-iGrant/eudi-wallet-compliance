import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_DATA_DIR } from '@iwc/controls';
import { parseEvidence, type ParsedEvidence } from '@iwc/shared';
import type { CheckExtras, CheckFunction } from '../../src/registry';
import type { AssessmentScope, Evidence, Verdict } from '../../src/types';

/**
 * Sensible default scope for tests that do not exercise scope-aware
 * behaviour. Tier 'ordinary' so most rules treat the EAA as the baseline
 * tier. Override fields per test as needed.
 */
export const DEFAULT_SCOPE: AssessmentScope = {
  module: 'eaa-conformance',
  profile: ['sd-jwt-vc'],
  role: ['issuer', 'verifier'],
  tier: 'ordinary',
};

export interface ReferenceSample {
  sample_id: string;
  title: string;
  description: string;
  profile: string;
  tier: 'ordinary-eaa' | 'qeaa' | 'pub-eaa';
  compact_serialisation: string;
  decoded_header: Record<string, unknown>;
  decoded_payload: Record<string, unknown>;
  issuer_cert_pem: string;
  exercises_controls: string[];
  generated_by: string;
  generated_at: string;
}

export async function loadSample(sampleId: string): Promise<ReferenceSample> {
  const path = join(DEFAULT_DATA_DIR, 'reference-samples', `${sampleId}.json`);
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as ReferenceSample;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export interface BuildCompactOptions {
  disclosures?: string[];
  keyBinding?: string;
  signature?: string;
}

/**
 * Build an SD-JWT VC compact serialisation from a logical header and
 * payload. The signature segment is a fixed placeholder by default; the
 * built-in checks parse structurally and do not verify cryptographic
 * signatures, so this is sufficient for the structural-check fixtures.
 */
export function buildCompact(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  opts: BuildCompactOptions = {},
): string {
  const jws = [
    base64UrlEncode(JSON.stringify(header)),
    base64UrlEncode(JSON.stringify(payload)),
    opts.signature ?? 'placeholder-signature',
  ].join('.');

  const parts = [jws, ...(opts.disclosures ?? [])];
  if (opts.keyBinding) {
    parts.push(opts.keyBinding);
    return parts.join('~');
  }
  // Issuance form: trailing tilde, no key binding.
  parts.push('');
  return parts.join('~');
}

/**
 * Test-only adapter that mirrors the pre-Phase-7 call shape
 * `check(evidence, scope)` while invoking the new
 * `check(parsedEvidence, scope, extras)` signature underneath.
 *
 * Each test that used to call `check(evidence, scope)` directly now
 * calls `runCheck(check, evidence, scope)` and gets identical
 * behaviour. Parsing happens here once, exactly as runAssessment does
 * in production. Parse failures and missing payloads are surfaced as
 * 'fail'/'na' verdicts so existing tests that exercise those paths
 * keep working without modification.
 */
export async function runCheck(
  fn: CheckFunction,
  evidence: Evidence,
  scope: AssessmentScope,
): Promise<Verdict> {
  const extras: CheckExtras = {
    issuerCert: evidence.issuerCert,
    statusListUrl: evidence.statusListUrl,
    typeMetadata: evidence.typeMetadata,
  };
  if (
    evidence.eaaPayload === undefined ||
    evidence.eaaPayload === null ||
    evidence.eaaPayload.trim().length === 0
  ) {
    // Mirror runAssessment's "no payload" outcome: don't call the
    // check at all; emit a short-circuit na verdict directly.
    return {
      controlId: 'test-runner',
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  let parsed: ParsedEvidence;
  try {
    parsed = parseEvidence(evidence.eaaPayload);
  } catch (err) {
    const message = (err as Error).message;
    return {
      controlId: 'test-runner',
      status: 'fail',
      evidenceRef: 'eaa-payload',
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }
  return fn(parsed, scope, extras);
}

/**
 * Convenience: return a compact serialisation for a loaded sample.
 *
 * With no opts the real signed `compact_serialisation` from the sample
 * is returned verbatim. With opts (custom disclosures, key binding,
 * altered signature), the helper rebuilds an unsigned compact form
 * from `decoded_header` + `decoded_payload`. The engine does not
 * verify signatures yet, so the unsigned variant is fine for negative
 * structural tests.
 */
export function compactFromSample(
  sample: ReferenceSample,
  opts: BuildCompactOptions = {},
): string {
  if (Object.keys(opts).length === 0) return sample.compact_serialisation;
  return buildCompact(sample.decoded_header, sample.decoded_payload, opts);
}
