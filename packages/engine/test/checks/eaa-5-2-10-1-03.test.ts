import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-03';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.10.1-03 (status component must be JSON object)', () => {
  it('passes when status is a JSON object', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
  });

  it('fails when status is a string instead of an object', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.payload_decoded, status: 'unrevoked' };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('not a JSON object');
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
