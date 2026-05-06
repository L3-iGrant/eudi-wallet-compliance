import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-05';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.2.10.1-05 (status.type is JSON String)', () => {
  it('returns na when status is absent', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('returns na when status is present but type is absent', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, status: { uri: 'https://x.example/status' } };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
  });

  it('passes when status.type is "TokenStatusList"', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      status: { type: 'TokenStatusList', uri: 'https://x.example/status' },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('fails when status.type is a number', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      status: { type: 1, uri: 'https://x.example/status' },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });

  it('fails when status is not an object', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, status: 'TokenStatusList' };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });
});
