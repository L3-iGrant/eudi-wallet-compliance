import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-5-05';
import { DEFAULT_SCOPE, buildCompact, loadSample, runCheck } from './helpers';

describe('EAA-5.5-05 (cnf.x5c excludes x5u and x5t#S256)', () => {
  it('passes when cnf has only x5c', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: { x5c: ['BASE64-CERT'] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('fails when cnf has x5c alongside x5u', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: { x5c: ['BASE64-CERT'], x5u: 'https://example/cert.pem' },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('x5u');
  });

  it('fails when cnf has x5c alongside x5t#S256', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: { x5c: ['BASE64-CERT'], 'x5t#S256': 'thumbprint' },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('x5t#S256');
  });

  it('returns na when cnf has no x5c', async () => {
    const sample = await loadSample('sjv-eaa-2');
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, sample.decoded_payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
