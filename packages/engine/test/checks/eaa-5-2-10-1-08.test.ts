import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-08';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-08 (status object includes index member)', () => {
  it('passes when status.index is present', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
  });

  it('fails when status is present but index is missing', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const status = { ...(sample.payload_decoded.status as Record<string, unknown>) };
    delete status.index;
    const broken = { ...sample.payload_decoded, status };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('missing the index member');
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
