import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-3-02';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.4.1.3-02 (disclosures parse as IETF SD-JWT structures)', () => {
  it('passes when every disclosure decodes to a valid array (sjv-eaa-3)', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/valid IETF SD-JWT/);
  });

  it('returns na when no disclosures are present (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('fails when a disclosure does not base64url-decode to a JSON array', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const compact = buildCompact(sample.decoded_header, sample.decoded_payload, {
      disclosures: ['not-base64-encoded'],
    });
    const verdict = await runCheck(check, { eaaPayload: compact }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/Malformed disclosures/);
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
