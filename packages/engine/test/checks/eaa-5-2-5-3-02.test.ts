import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-5-3-02';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.2.5.3-02 (non-subject attributes need sub_id or sub_aka)', () => {
  it('returns na when subAttrs is absent (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('passes when each subAttrs group carries sub_id or sub_aka', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: [
        { sub_id: 'urn:1', attrs: ['a'] },
        { sub_aka: 'p', attrs: ['b'] },
      ],
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('fails when a group has neither sub_id nor sub_aka', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      subAttrs: { attrs: ['orphan'] },
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
    const payload = { ...sample.decoded_payload, subAttrs: 'oops' };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
  });
});
