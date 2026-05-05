import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-5-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.4.1.5-01 (_sd_alg names a registered hash algorithm)', () => {
  it('passes when _sd_alg is sha-256 (sjv-eaa-3)', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('sha-256');
  });

  it('returns na when _sd_alg is absent (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('warns when _sd_alg is not a registered hash name', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.decoded_payload, _sd_alg: 'md5' };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('warn');
    expect(verdict.notes).toMatch(/not a commonly-registered/);
  });

  it('fails when _sd_alg is a non-string', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.decoded_payload, _sd_alg: 256 };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('not a JSON string');
  });
});
