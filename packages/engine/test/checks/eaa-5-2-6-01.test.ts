import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-6-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.2.6-01 (iat is NumericDate when present)', () => {
  it('passes when iat is a non-negative integer (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
  });

  it('returns na when iat is absent', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const { iat: _iat, ...rest } = sample.decoded_payload as Record<string, unknown>;
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, rest) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
  });

  it('fails when iat is a string', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, iat: '1777680788' };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });

  it('fails when iat is a fractional number', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, iat: 1777680788.5 };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });

  it('fails when iat is negative', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, iat: -1 };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });
});
