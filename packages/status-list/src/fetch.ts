import { inflateSync } from 'node:zlib';
import { decodeJwt } from 'jose';
import { decode as decodeCbor } from 'cbor-x';
import type { StatusList, StatusListFormat } from './types';

const MEDIA_JWT = 'application/statuslist+jwt';
const MEDIA_CWT = 'application/statuslist+cwt';

interface RawStatusListClaim {
  bits: number;
  lst: string | Uint8Array;
}

/**
 * Fetch and parse a Token Status List published per
 * draft-ietf-oauth-status-list-13. The Content-Type header decides between
 * the JWT and CWT serialisations. Signature verification is deliberately
 * deferred until trust-list integration; this resolver only decodes.
 */
export async function fetchStatusList(uri: string): Promise<StatusList> {
  const response = await fetch(uri, {
    headers: { Accept: `${MEDIA_JWT}, ${MEDIA_CWT}` },
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch status list at ${uri}: ${response.status} ${response.statusText}`,
    );
  }
  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  if (contentType.includes(MEDIA_JWT)) {
    const token = (await response.text()).trim();
    return parseJwt(token);
  }
  if (contentType.includes(MEDIA_CWT)) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    return parseCwt(buffer);
  }
  throw new Error(
    `Unsupported status list content-type "${contentType || 'unset'}". ` +
      `Expected ${MEDIA_JWT} or ${MEDIA_CWT}.`,
  );
}

function parseJwt(token: string): StatusList {
  const payload = decodeJwt(token);
  const issuer = typeof payload.iss === 'string' ? payload.iss : '';
  const claim = payload['status_list'];
  if (!isRawClaim(claim)) {
    throw new Error('JWT status list payload is missing a valid status_list claim');
  }
  const compressed = decodeLst(claim.lst);
  const bits = inflateSync(compressed);
  assertBitsPerStatus(claim.bits);
  return {
    format: 'jwt' as StatusListFormat,
    issuer,
    statusListBits: new Uint8Array(bits),
    bitsPerStatus: claim.bits,
  };
}

function parseCwt(buffer: Uint8Array): StatusList {
  // COSE_Sign1 = [protected, unprotected, payload, signature]. cbor-x
  // surfaces a tag-18 wrapper as a `Tag` instance; we accept either the
  // tagged or untagged form to be tolerant of upstream encoders.
  const decoded = decodeCbor(buffer) as unknown;
  const sign1 = isTag(decoded) ? (decoded.value as unknown[]) : (decoded as unknown[]);
  if (!Array.isArray(sign1) || sign1.length < 3) {
    throw new Error('CWT status list is not a COSE_Sign1 array of length >= 3');
  }
  const payloadBytes = sign1[2];
  if (!(payloadBytes instanceof Uint8Array)) {
    throw new Error('CWT status list COSE_Sign1 payload is not a byte string');
  }
  const claims = decodeCbor(payloadBytes) as Map<unknown, unknown> | Record<string, unknown>;
  const claim = pickClaim(claims, 'status_list', 65533);
  const issuer = pickClaim(claims, 'iss', 1);
  if (!isRawClaim(claim)) {
    throw new Error('CWT status list payload is missing a valid status_list claim');
  }
  const compressed = decodeLst(claim.lst);
  const bits = inflateSync(compressed);
  assertBitsPerStatus(claim.bits);
  return {
    format: 'cwt' as StatusListFormat,
    issuer: typeof issuer === 'string' ? issuer : '',
    statusListBits: new Uint8Array(bits),
    bitsPerStatus: claim.bits,
  };
}

function isRawClaim(value: unknown): value is RawStatusListClaim {
  if (typeof value !== 'object' || value === null) return false;
  const bits = readKey(value, 'bits', 0);
  const lst = readKey(value, 'lst', 1);
  return (
    typeof bits === 'number' && (typeof lst === 'string' || lst instanceof Uint8Array)
  );
}

function readKey(value: object, stringKey: string, numericKey: number): unknown {
  if (value instanceof Map) {
    return value.get(stringKey) ?? value.get(numericKey);
  }
  const record = value as Record<string | number, unknown>;
  return record[stringKey] ?? record[numericKey];
}

function decodeLst(lst: string | Uint8Array): Buffer {
  if (lst instanceof Uint8Array) return Buffer.from(lst);
  return Buffer.from(lst, 'base64url');
}

function assertBitsPerStatus(bits: number): void {
  if (![1, 2, 4, 8].includes(bits)) {
    throw new Error(`status list bits must be 1, 2, 4, or 8 (got ${bits})`);
  }
}

function pickClaim(
  claims: Map<unknown, unknown> | Record<string, unknown>,
  stringKey: string,
  numericKey: number,
): unknown {
  return readKey(claims as object, stringKey, numericKey);
}

interface CborTag {
  tag: number;
  value: unknown;
}

function isTag(value: unknown): value is CborTag {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tag' in value &&
    'value' in value &&
    typeof (value as CborTag).tag === 'number'
  );
}
