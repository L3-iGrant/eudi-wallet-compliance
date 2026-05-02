import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-7-2-06';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.7.2-06 (adm_nbf and adm_exp must be NumericDate)', () => {
  it('returns na when neither claim is present', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('passes when both are non-negative integers and exp > nbf', async () => {
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

  it('fails when adm_nbf is a string', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      adm_nbf: '1700000000',
      adm_exp: 1900000000,
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('adm_nbf');
  });

  it('fails when adm_exp <= adm_nbf', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      adm_nbf: 1900000000,
      adm_exp: 1700000000,
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('forward-going');
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
