import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-2-4-1-03';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.4.1-03 (issuing_authority must not coexist with x5c qualified cert)', () => {
  it('warns when both x5c and issuing_authority are present (baseline ETSI sample)', async () => {
    // The ETSI baseline samples carry both x5c (signing cert) and
    // issuing_authority (claim) by design, which is exactly the
    // condition the spec rule warns on.
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('warn');
    expect(verdict.notes).toContain('trust-list lookup');
  });

  it('passes when x5c is present without issuing_authority', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const { issuing_authority: _ia, ...payloadWithoutIa } = sample.decoded_payload as {
      issuing_authority?: unknown;
      [k: string]: unknown;
    };
    void _ia;
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, payloadWithoutIa) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('x5c present without issuing_authority');
  });

  it('passes when issuing_authority is present without x5c', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const { x5c: _x5c, ...headerWithoutX5c } = sample.decoded_header as {
      x5c?: unknown;
      [k: string]: unknown;
    };
    void _x5c;
    const verdict = await check(
      { eaaPayload: buildCompact(headerWithoutX5c, sample.decoded_payload) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('issuing_authority present');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
