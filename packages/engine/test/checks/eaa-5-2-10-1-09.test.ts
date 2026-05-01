import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-09';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-09 (status.index is a JSON integer)', () => {
  it('passes when status.index is a non-negative integer', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const verdict = check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/JSON integer: \d+/);
  });

  it('fails when status.index is a string', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const broken = {
      ...sample.payload_decoded,
      status: { ...(sample.payload_decoded.status as object), index: '42' },
    };
    const verdict = check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('non-negative JSON integer');
  });

  it('returns na when status is absent', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('returns na when no eaaPayload is supplied', () => {
    const verdict = check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
