import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-04';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-04 (status JSON Object type member)', () => {
  it('passes when status is present with a string type member (sjv-eaa-7)', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('status.type member present');
  });

  it('fails when status is present but missing the type member', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const status = { ...(sample.decoded_payload.status as Record<string, unknown>) };
    delete status.type;
    const broken = { ...sample.decoded_payload, status };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('missing the type member');
  });

  it('fails when status.type is not a string', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const broken = {
      ...sample.decoded_payload,
      status: { ...(sample.decoded_payload.status as object), type: 42 },
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('not a non-empty string');
  });

  it('returns na when status is absent (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
    expect(verdict.notes).toContain('status component absent');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
