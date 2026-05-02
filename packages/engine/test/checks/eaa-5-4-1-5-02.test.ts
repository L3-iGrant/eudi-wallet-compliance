import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-5-02';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.4.1.5-02 (_sd_alg required when disclosures exist)', () => {
  it('passes when disclosures and _sd_alg both present (sjv-eaa-3)', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
  });

  it('returns na when no disclosures (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('fails when disclosures are present but _sd_alg is missing', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const broken = { ...sample.decoded_payload };
    delete (broken as Record<string, unknown>)._sd_alg;
    const compact = buildCompact(sample.decoded_header, broken, {
      disclosures: extractDisclosures(sample.compact_serialisation),
    });
    const verdict = await check({ eaaPayload: compact }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/_sd_alg is missing/);
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
