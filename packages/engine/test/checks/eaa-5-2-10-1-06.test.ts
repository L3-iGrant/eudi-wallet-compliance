import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-06';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-06 (status object includes purpose member)', () => {
  it('passes when status.purpose is a non-empty string', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const verdict = check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('purpose member present');
  });

  it('fails when status is present but purpose is missing', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const status = { ...(sample.payload_decoded.status as Record<string, unknown>) };
    delete status.purpose;
    const broken = { ...sample.payload_decoded, status };
    const verdict = check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('missing the purpose member');
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
