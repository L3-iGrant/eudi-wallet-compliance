import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-3-04';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.3-04 (sub_id is JSON String)', () => {
  it('returns na when subAttrs absent', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('returns na when no group carries sub_id', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { sub_aka: 'p', attrs: [] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
  });

  it('passes when sub_id is a non-empty string', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { sub_id: 'urn:subject:1', attrs: [] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('fails when sub_id is a number', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { sub_id: 42, attrs: [] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/not a JSON string/);
  });

  it('fails when sub_id is an empty string', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { sub_id: '', attrs: [] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });
});
