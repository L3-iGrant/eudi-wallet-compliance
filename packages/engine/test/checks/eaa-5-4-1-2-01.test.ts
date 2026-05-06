import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-2-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.4.1.2-01 (no explicit disclosure-schema identifier)', () => {
  it('passes for a baseline EAA without forbidden keys', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
  });

  it('fails when payload includes a disclosure_schema claim', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.decoded_payload, disclosure_schema: 'urn:foo' };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('disclosure_schema');
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
