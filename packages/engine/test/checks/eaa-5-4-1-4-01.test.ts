import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-4-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.4.1.4-01 (selectively-disclosable JSON properties require _sd)', () => {
  it('passes when disclosures present and payload._sd carries digests (sjv-eaa-3)', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/_sd digest/);
  });

  it('returns na when no object-property disclosures (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('fails when disclosures present but no _sd anywhere in the payload', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const broken = { ...sample.decoded_payload };
    delete (broken as Record<string, unknown>)._sd;
    const compact = buildCompact(sample.decoded_header, broken, {
      disclosures: extractDisclosures(sample.compact_serialisation),
    });
    const verdict = await runCheck(check, { eaaPayload: compact }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toMatch(/no _sd array/);
  });

  it('passes when _sd lives inside nested objects only (Truvity SJV-EAA-12 shape)', async () => {
    // Mirrors Truvity TRUV submission: top-level _sd absent, but each
    // element of arrayClaim carries its own _sd array. IETF SD-JWT
    // §5.2.4.1 allows the digest to appear at the same level as the
    // claim it replaces, which can be a nested object.
    const sample = await loadSample('sjv-eaa-3');
    const disclosures = extractDisclosures(sample.compact_serialisation);
    const halfA = disclosures.slice(0, Math.ceil(disclosures.length / 2));
    const halfB = disclosures.slice(Math.ceil(disclosures.length / 2));
    const fakeDigest = (d: string, i: number) =>
      `digest${i}_of_${d.slice(0, 6)}`.padEnd(43, 'x');
    const payload: Record<string, unknown> = {
      iss: 'https://example/issuer',
      iat: 1778836937,
      vct: 'urn:eudi:pid:1',
      _sd_alg: 'sha-256',
      arrayClaim: [
        { _sd: halfA.map((d, i) => fakeDigest(d, i)) },
        { _sd: halfB.map((d, i) => fakeDigest(d, halfA.length + i)) },
      ],
    };
    const compact = buildCompact(sample.decoded_header, payload, { disclosures });
    const verdict = await runCheck(check, { eaaPayload: compact }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/cover/);
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});

function extractDisclosures(compact: string): string[] {
  const parts = compact.split('~');
  return parts.slice(1, -1);
}
