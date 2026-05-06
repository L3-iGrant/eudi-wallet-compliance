import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-4-02';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.4.1.4-02 (array-element disclosure placeholders)', () => {
  it('returns na when no placeholder objects are present (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('passes when every placeholder is well-formed', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      nationalities: [{ '...': 'aGVsbG8' }, 'PT'],
      // a deeper nested placeholder to exercise the recursive walk
      addresses: [
        {
          street: 'Main',
          tags: [{ '...': 'd29ybGQ' }],
        },
      ],
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/2 array-element disclosure placeholder/);
  });

  it('fails when a placeholder has additional members', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      nationalities: [{ '...': 'digest', extra: 'oops' }],
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/2 keys/);
  });

  it('fails when "..." value is not a string', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      nationalities: [{ '...': 42 }],
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/expected a base64url string/);
  });

  it('fails when "..." value is an empty string', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const payload = {
      ...sample.decoded_payload,
      nationalities: [{ '...': '' }],
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/empty string/);
  });
});
