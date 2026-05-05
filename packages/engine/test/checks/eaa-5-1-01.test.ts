import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-1-01';
import { DEFAULT_SCOPE, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.1-01 (SD-JWT VC compact serialisation parses)', () => {
  it('passes on a well-formed compact serialisation built from sjv-eaa-1', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, 
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.controlId).toBe('EAA-5.1-01');
    expect(verdict.evidenceRef).toBe('eaa-payload');
  });

  it('fails on a malformed compact (missing tilde separator)', async () => {
    const verdict = await runCheck(check, 
      { eaaPayload: 'aGVsbG8.aGVsbG8.bWFkZXVw' },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    // Phase 7: the parse-failure message comes from the centralised
    // parse step (in runCheck / runAssessment), not from this check
    // itself. Wording therefore reads "could not be parsed".
    expect(verdict.notes).toContain('could not be parsed');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
    expect(verdict.evidenceRef).toBe('');
    expect(verdict.notes).toContain('No EAA payload supplied');
  });
});
