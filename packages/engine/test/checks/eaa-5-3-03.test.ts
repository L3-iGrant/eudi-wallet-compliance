import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-3-03';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.3-03 (subAttrs sub_id/sub_aka mutex)', () => {
  it('returns na when subAttrs absent (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('passes when subAttrs is one object with only sub_id', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { sub_id: 'urn:subject:1', attrs: ['foo'] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('passes when subAttrs is one object with only sub_aka', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { sub_aka: 'pseudonym-A', attrs: ['foo'] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('passes when subAttrs is an array of valid groups', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: [
        { sub_id: 'urn:subject:1', attrs: ['a'] },
        { sub_aka: 'p', attrs: ['b'] },
      ],
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('fails when both sub_id and sub_aka are present', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { sub_id: 'urn:subject:1', sub_aka: 'p', attrs: [] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/both sub_id and sub_aka/);
  });

  it('fails when neither sub_id nor sub_aka is present', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { attrs: ['a'] },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/neither sub_id nor sub_aka/);
  });

  it('fails when subAttrs is not an object or array of objects', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = { ...sample.decoded_payload, subAttrs: 'not-an-object' };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
