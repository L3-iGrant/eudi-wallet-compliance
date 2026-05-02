import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-09';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-09 (status.index is a JSON integer)', () => {
  it('passes when status.index is a non-negative integer', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/JSON integer: \d+/);
  });

  it('fails when status.index is a string', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const broken = {
      ...sample.decoded_payload,
      status: { ...(sample.decoded_payload.status as object), index: '42' },
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('non-negative JSON integer');
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
