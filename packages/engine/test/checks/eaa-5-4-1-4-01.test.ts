import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-4-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.4.1.4-01 (selectively-disclosable JSON properties require _sd)', () => {
  it('passes when disclosures present and payload._sd carries digests (sjv-eaa-3)', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/disclosure digest/);
  });

  it('returns na when no object-property disclosures (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('fails when disclosures present but payload._sd is missing', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const broken = { ...sample.decoded_payload };
    delete (broken as Record<string, unknown>)._sd;
    const compact = buildCompact(sample.decoded_header, broken, {
      disclosures: extractDisclosures(sample.compact_serialisation),
    });
    const verdict = await check({ eaaPayload: compact }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/missing or empty/);
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});

function extractDisclosures(compact: string): string[] {
  const parts = compact.split('~');
  return parts.slice(1, -1);
}
