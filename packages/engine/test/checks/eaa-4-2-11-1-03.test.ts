import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-4-2-11-1-03';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-4.2.11.1-03 (shortLived ⊕ status mutex, tier-aware)', () => {
  it('fails when both shortLived and status are present', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = {
      ...sample.decoded_payload,
      shortLived: null,
      status: {
        type: 'TokenStatusList',
        purpose: 'revocation',
        index: 1,
        uri: 'https://example/status',
      },
    };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('exactly one revocation strategy');
  });

  it('passes when only status is present (sjv-eaa-7 has status, no shortLived)', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('status');
  });

  it('passes when only shortLived is present (sjv-eaa-6 carries shortLived, no status)', async () => {
    const sample = await loadSample('sjv-eaa-6');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('shortLived');
  });

  it('passes when neither is present and tier is ordinary', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('fails when neither is present and tier is qeaa (one is required)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      { ...DEFAULT_SCOPE, tier: 'qeaa' },
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('tier "qeaa"');
  });

  it('fails when neither is present and tier is pub-eaa', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      { ...DEFAULT_SCOPE, tier: 'pub-eaa' },
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('tier "pub-eaa"');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
