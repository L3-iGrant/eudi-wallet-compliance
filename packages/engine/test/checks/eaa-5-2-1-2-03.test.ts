import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-1-2-03';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.1.2-03 (vct#integrity claim present)', () => {
  it('passes when the payload includes a non-empty vct#integrity claim', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('vct#integrity claim present');
  });

  it('fails when the payload is missing the vct#integrity claim', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.decoded_payload };
    delete broken['vct#integrity'];
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('vct#integrity');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
