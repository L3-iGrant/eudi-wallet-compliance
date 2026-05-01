import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-7-1-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.7.1-01 (nbf claim present, integer NumericDate)', () => {
  it('passes when the payload includes an integer nbf claim', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/nbf claim present: \d+/);
  });

  it('fails when the payload nbf is a non-integer string', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.payload_decoded, nbf: '2026-05-01' };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('NumericDate');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
