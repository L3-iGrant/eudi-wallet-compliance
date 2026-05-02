import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-8-2-05';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.8.2-05 (oneTime must use the JSON null primitive)', () => {
  it('passes when oneTime is JSON null (sjv-eaa-5)', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
  });

  it('returns na when oneTime is absent (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('fails when oneTime is true instead of null', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, oneTime: true };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('not JSON null');
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
