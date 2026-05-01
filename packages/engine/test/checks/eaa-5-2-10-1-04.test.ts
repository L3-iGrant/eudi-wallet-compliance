import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-04';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-04 (status JSON Object type member)', () => {
  it('passes when status is present with a string type member (sjv-eaa-5)', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const verdict = check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('status.type member present');
  });

  it('fails when status is present but missing the type member', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const status = { ...(sample.payload_decoded.status as Record<string, unknown>) };
    delete status.type;
    const broken = { ...sample.payload_decoded, status };
    const verdict = check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('missing the type member');
  });

  it('fails when status.type is not a string', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const broken = {
      ...sample.payload_decoded,
      status: { ...(sample.payload_decoded.status as object), type: 42 },
    };
    const verdict = check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('not a non-empty string');
  });

  it('returns na when status is absent (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
    expect(verdict.notes).toContain('status component absent');
  });

  it('returns na when no eaaPayload is supplied', () => {
    const verdict = check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
