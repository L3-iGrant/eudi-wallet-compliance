import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-11';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-11 (status.uri is a non-empty URL string)', () => {
  it('passes when status.uri is a valid https URL', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('valid URL');
  });

  it('fails when status.uri is not a parseable URL', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const broken = {
      ...sample.payload_decoded,
      status: { ...(sample.payload_decoded.status as object), uri: 'not-a-url' },
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('not a valid http(s) URL');
  });

  it('fails when status.uri is a number', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const broken = {
      ...sample.payload_decoded,
      status: { ...(sample.payload_decoded.status as object), uri: 42 },
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('not a non-empty JSON string');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
