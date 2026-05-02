import { afterEach, describe, it, expect, vi } from 'vitest';
import { deflateSync } from 'node:zlib';
import { check } from '../../src/checks/eaa-5-2-10-2-01';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

function buildUnsignedJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'statuslist+jwt' };
  const b64 = (v: object): string =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  return `${b64(header)}.${b64(payload)}.`;
}

function buildCompressedLst(bytes: number[]): string {
  return Buffer.from(deflateSync(Buffer.from(bytes))).toString('base64url');
}

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('EAA-5.2.10.2-01 (status URI must resolve)', () => {
  it('passes when the list resolves and index reads out a value', async () => {
    const sample = await loadSample('sjv-eaa-7');
    // sjv-eaa-7 has status.uri = https://qtsp.example/status/qeaa-revocation, index 42.
    // Build a 1-bit list large enough to hold index 42 (need 6 bytes).
    const bytes = new Array(8).fill(0);
    // Set bit 42 (byte 5, bit-from-MSB 2) to 1: 0x20 in byte 5.
    bytes[5] = 0x20;
    const token = buildUnsignedJwt({
      iss: 'https://qtsp.example',
      status_list: { bits: 1, lst: buildCompressedLst(bytes) },
    });
    globalThis.fetch = vi.fn(async () =>
      new Response(token, {
        status: 200,
        headers: { 'content-type': 'application/statuslist+jwt' },
      }),
    ) as typeof fetch;

    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );

    expect(verdict.status).toBe('pass');
    expect(verdict.notes).toContain('returned status value 1');
    expect(verdict.notes).toContain('jwt');
  });

  it('fails when the fetch returns a non-2xx', async () => {
    const sample = await loadSample('sjv-eaa-7');
    globalThis.fetch = vi.fn(async () =>
      new Response('gone', { status: 410, statusText: 'Gone' }),
    ) as typeof fetch;

    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );

    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('Failed to fetch');
  });

  it('returns na when the EAA payload has no status component', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check(
      { eaaPayload: compactFromSample(sample) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('na');
    expect(verdict.notes).toContain('status component absent');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });

  it('fails when status.index is missing', async () => {
    const sample = await loadSample('sjv-eaa-7');
    const broken = {
      ...sample.decoded_payload,
      status: { ...(sample.decoded_payload.status as object), index: undefined },
    };
    delete (broken.status as Record<string, unknown>).index;
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('status.index is missing');
  });
});
