import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-4-1-03';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.4.1-03 (issuing_authority must not coexist with x5c qualified cert)', () => {
  it('warns when both x5c and issuing_authority are present', async () => {
    const sample = await loadSample('sjv-eaa-5');
    // sjv-eaa-5 has x5c in header; add issuing_authority to payload.
    const broken = {
      ...sample.payload_decoded,
      issuing_authority: 'Example Issuing Authority',
    };
    const verdict = check(
      { eaaPayload: buildCompact(sample.header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('warn');
    expect(verdict.notes).toContain('trust-list lookup');
  });

  it('passes when x5c is present without issuing_authority (sjv-eaa-5)', async () => {
    const sample = await loadSample('sjv-eaa-5');
    const verdict = check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('x5c present without issuing_authority');
  });

  it('passes when issuing_authority is present without x5c (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('issuing_authority present');
  });

  it('returns na when no eaaPayload is supplied', () => {
    const verdict = check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
