import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DEFAULT_DATA_DIR } from '@iwc/controls';

export interface ReferenceSample {
  sample_id: string;
  title: string;
  description: string;
  profile: string;
  payload: string;
  header: Record<string, unknown>;
  payload_decoded: Record<string, unknown>;
  exercises_controls: string[];
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

/** Convenience: build a compact serialisation from a loaded sample. */
export function compactFromSample(
  sample: ReferenceSample,
  opts: BuildCompactOptions = {},
): string {
  return buildCompact(sample.header, sample.payload_decoded, opts);
}
