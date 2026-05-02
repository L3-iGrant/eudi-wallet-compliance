import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-1-01';
import { DEFAULT_SCOPE, compactFromSample, loadSample } from './helpers';

describe('EAA-5.4.1.1-01 (EAA must support SD-JWT selective disclosure)', () => {
  it('passes when the EAA carries disclosures (sjv-eaa-3)', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/disclosure/);
  });

  it('returns na when the EAA carries no disclosures and no _sd (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
    expect(verdict.notes).toMatch(/SD support not exercised/);
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
