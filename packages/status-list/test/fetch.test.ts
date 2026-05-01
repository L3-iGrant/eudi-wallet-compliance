import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { deflateSync } from 'node:zlib';
import { fetchStatusList } from '../src/fetch';
import { getStatusAt } from '../src/lookup';

/**
 * Build an unsigned JWT `header.payload.` (empty signature). `decodeJwt` from
 * jose accepts this since it does not verify signatures.
 */
function buildUnsignedJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'statuslist+jwt' };
  const b64 = (v: object): string =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  return `${b64(header)}.${b64(payload)}.`;
}

function buildCompressedLst(bytes: number[]): string {
  const compressed = deflateSync(Buffer.from(bytes));
  return Buffer.from(compressed).toString('base64url');
}

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('fetchStatusList (JWT)', () => {
  it('parses a JWT-format status list response', async () => {
    // 0xA0 = 1010 0000 → bits: 1,0,1,0,0,0,0,0
    const lst = buildCompressedLst([0xa0]);
    const token = buildUnsignedJwt({
      iss: 'https://issuer.example',
      status_list: { bits: 1, lst },
    });
    globalThis.fetch = vi.fn(async () =>
      new Response(token, {
        status: 200,
        headers: { 'content-type': 'application/statuslist+jwt' },
      }),
    ) as typeof fetch;

    const list = await fetchStatusList('https://issuer.example/list/1');

    expect(list.format).toBe('jwt');
    expect(list.issuer).toBe('https://issuer.example');
    expect(list.bitsPerStatus).toBe(1);
    expect(getStatusAt(list, 0)).toBe(1);
    expect(getStatusAt(list, 1)).toBe(0);
    expect(getStatusAt(list, 2)).toBe(1);
  });

  it('throws on a non-2xx response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('not found', { status: 404, statusText: 'Not Found' }),
    ) as typeof fetch;

    await expect(fetchStatusList('https://issuer.example/missing')).rejects.toThrow(
      /Failed to fetch status list/,
    );
  });

  it('surfaces a CORS-aware error when fetch itself rejects', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;

    await expect(fetchStatusList('https://issuer.example/blocked')).rejects.toThrow(
      /CORS/,
    );
  });

  it('throws on an unsupported content-type', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response('plain text', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    ) as typeof fetch;

    await expect(fetchStatusList('https://issuer.example/list/2')).rejects.toThrow(
      /Unsupported status list content-type/,
    );
  });

  it('throws when status_list claim is missing', async () => {
    const token = buildUnsignedJwt({ iss: 'https://issuer.example' });
    globalThis.fetch = vi.fn(async () =>
      new Response(token, {
        status: 200,
        headers: { 'content-type': 'application/statuslist+jwt' },
      }),
    ) as typeof fetch;

    await expect(fetchStatusList('https://issuer.example/list/3')).rejects.toThrow(
      /missing a valid status_list claim/,
    );
  });
});
