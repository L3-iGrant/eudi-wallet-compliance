import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-10-1-06';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.2.10.1-06 (status object includes purpose member)', () => {
  it('passes when status.purpose is a non-empty string', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('purpose member present');
  });

  it('fails when status is present but purpose is missing', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const status = { ...(sample.decoded_payload.status as Record<string, unknown>) };
    delete status.purpose;
    const broken = { ...sample.decoded_payload, status };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('missing the purpose member');
  });

  it('returns na when status is absent', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('passes when status uses the IETF nested envelope (no top-level purpose)', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const ietfPayload = {
      ...sample.decoded_payload,
      status: {
        status_list: {
          idx: 1,
          uri: 'https://qtsp.example/status/ietf-form',
        },
      },
    };
    const verdict = await runCheck(check, 
      { eaaPayload: buildCompact(sample.decoded_header, ietfPayload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('IETF Token Status List nested envelope');
  });
});
