import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-7-2-05';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.7.2-05 (adm_nbf and adm_exp must appear together or not at all)', () => {
  it('returns na when neither claim is present (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('passes when both adm_nbf and adm_exp are present', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      adm_nbf: 1700000000,
      adm_exp: 1900000000,
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('fails when only adm_nbf is present', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, adm_nbf: 1700000000 };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('adm_exp is missing');
  });

  it('fails when only adm_exp is present', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, adm_exp: 1900000000 };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('adm_nbf is missing');
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
