import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-1-2-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.1.2-01 (vct claim present)', () => {
  it('passes when the payload includes a non-empty vct claim', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('vct claim present');
  });

  it('fails when the payload is missing the vct claim', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.payload_decoded };
    delete broken.vct;
    const verdict = await check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('missing the vct claim');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
    expect(verdict.evidenceRef).toBe('');
  });
});
