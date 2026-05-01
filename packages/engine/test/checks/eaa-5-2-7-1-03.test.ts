import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-7-1-03';
import { buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.7.1-03 (exp claim present, integer, exp > nbf)', () => {
  it('passes when exp is an integer NumericDate strictly greater than nbf', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = check({ eaaPayload: compactFromSample(sample) });
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
    const verdict = check({
      eaaPayload: buildCompact(sample.header, broken),
    });
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('strictly greater than nbf');
  });

  it('returns na when no eaaPayload is supplied', () => {
    const verdict = check({});
    expect(verdict.status).toBe('na');
  });
});
