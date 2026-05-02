import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-5-04';
import { DEFAULT_SCOPE, buildCompact, loadSample } from './helpers';

describe('EAA-5.5-04 (cnf.x5u must be paired with cnf.x5t#S256)', () => {
  it('passes when cnf has both x5u and x5t#S256', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: {
        x5u: 'https://example/cert.pem',
        'x5t#S256': 'thumbprint',
      },
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('fails when cnf has x5u without x5t#S256', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      cnf: { x5u: 'https://example/cert.pem' },
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('cnf.x5t#S256 is missing');
  });

  it('returns na when cnf has no x5u', async () => {
    const sample = await loadSample('sjv-eaa-2');
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, sample.decoded_payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
