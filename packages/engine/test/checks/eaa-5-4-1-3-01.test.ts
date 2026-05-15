import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-5-4-1-3-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample, runCheck } from './helpers';

describe('EAA-5.4.1.3-01 (one disclosure per selectively-disclosable attribute)', () => {
  it('passes when disclosure count matches _sd digest count (sjv-eaa-3)', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toMatch(/match/);
  });

  it('returns na when no disclosures and no _sd are present (sjv-eaa-1)', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await runCheck(check, { eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('warns when _sd has fewer entries than disclosures', async () => {
    const sample = await loadSample('sjv-eaa-3');
    const broken = {
      ...sample.decoded_payload,
      _sd: [(sample.decoded_payload._sd as string[])[0]],
    };
    const verdict = await runCheck(check, 
      {
        eaaPayload: buildCompact(sample.decoded_header, broken, {
          disclosures: extractDisclosures(sample.compact_serialisation),
        }),
      },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('warn');
    expect(verdict.notes).toMatch(/do not match/);
  });

  it('counts _sd digests across nested objects (Truvity SJV-EAA-12 shape)', async () => {
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
    const verdict = await runCheck(
      check,
      {
        eaaPayload: buildCompact(sample.decoded_header, payload, { disclosures }),
      },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('pass');
  });

  it('returns na when no eaaPayload supplied', async () => {
    const verdict = await runCheck(check, {}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});

function extractDisclosures(compact: string): string[] {
  const parts = compact.split('~');
  // Issuance form: trailing tilde + empty string. Exclude jws (first) and final empty/kbjwt.
  return parts.slice(1, -1);
}
