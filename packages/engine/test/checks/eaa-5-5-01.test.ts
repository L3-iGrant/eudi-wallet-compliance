import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-5-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.5-01 (cnf claim recommended)', () => {
  it('passes when cnf is present (sjv-eaa-2 includes a cnf.jwk)', async () => {
    const sample = await loadSample('sjv-eaa-2');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('cnf claim present');
  });

  it('warns when cnf is absent (sjv-eaa-1 has no cnf)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('warn');
    expect(verdict.notes).toContain('Recommended for key-bound EAAs');
  });

  it('fails when cnf is present but malformed (string instead of object)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.payload_decoded, cnf: 'not-an-object' };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('not a JSON object');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
