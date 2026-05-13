import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-5-02';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.5-02 (cnf must contain JWK or certificate reference)', () => {
  it('passes when cnf carries a well-formed EC JWK (sjv-eaa-2)', async () => {
    const sample = await loadSample('sjv-eaa-2');
    const verdict = await runCheck(check, 
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('kty=EC');
  });

  it('passes when cnf carries an x5c certificate reference', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: { x5c: ['BASE64-CERT-FIRST-LINE'] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('certificate reference');
  });

  it('fails when cnf has neither jwk nor a certificate reference', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: { kid: 'some-key-id' },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/neither a jwk.*x5c/);
  });

  it('fails when cnf.jwk is missing kty', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: { jwk: { crv: 'P-256', x: 'x', y: 'y' } },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('jwk.kty missing');
  });

  it('fails when an EC JWK is missing the y coordinate', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: { jwk: { kty: 'EC', crv: 'P-256', x: 'x' } },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('jwk.y missing');
  });

  it('returns na when cnf is absent', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, 
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
