import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-10';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-10 (status object includes uri member)', () => {
  it('passes when status.uri is present', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
  });

  it('fails when status is present but uri is missing', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const status = { ...(sample.decoded_payload.status as Record<string, unknown>) };
    delete status.uri;
    const broken = { ...sample.decoded_payload, status };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('missing the uri member');
  });

  it('returns na when status is absent', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
