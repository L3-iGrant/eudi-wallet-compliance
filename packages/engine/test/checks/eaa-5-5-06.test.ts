import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-5-06';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.5-06 (cnf should carry public key, not certificate)', () => {
  it('returns na when cnf is absent (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('passes when cnf carries a jwk', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      cnf: { jwk: { kty: 'EC', crv: 'P-256', x: 'abc', y: 'def' } },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('passes when cnf carries a kid', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, cnf: { kid: 'key-1' } };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('warns when cnf carries only x5c', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      cnf: { x5c: ['MIIB...'] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('warn');
    expect(verdict.notes).toMatch(/certificate/);
  });

  it('warns when cnf carries only x5t#S256', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      cnf: { 'x5t#S256': 'aGVsbG8' },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('warn');
  });

  it('fails when cnf is not an object', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, cnf: 'a string' };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });
});
