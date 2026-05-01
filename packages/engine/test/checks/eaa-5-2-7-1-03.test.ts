import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-7-1-03';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.7.1-03 (exp claim present, integer, exp > nbf)', () => {
  it('passes when exp is an integer NumericDate strictly greater than nbf', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/exp claim present: \d+/);
  });

  it('fails when exp is set to a value at or before nbf (never-valid window)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.payload_decoded,
      nbf: 1735689600,
      exp: 1735689600, // equal to nbf, must be strictly greater
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('strictly greater than nbf');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
