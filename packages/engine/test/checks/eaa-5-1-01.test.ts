import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-1-01';
import { DEFAULT_SCOPE, compactFromSample, loadSample } from './helpers';

describe('EAA-5.1-01 (SD-JWT VC compact serialisation parses)', () => {
  it('passes on a well-formed compact serialisation built from sjv-eaa-1', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.controlId).toBe('EAA-5.1-01');
    expect(verdict.evidenceRef).toBe('eaa-payload');
  });

  it('fails on a malformed compact (missing tilde separator)', () => {
    const verdict = check(
      { eaaPayload: 'aGVsbG8.aGVsbG8.bWFkZXVw' },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('does not parse');
  });

  it('returns na when no eaaPayload is supplied', () => {
    const verdict = check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
    expect(verdict.evidenceRef).toBe('');
    expect(verdict.notes).toContain('No EAA payload supplied');
  });
});
