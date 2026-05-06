/**
 * Parser for ISO/IEC 18013-5 mdoc / mDL credentials extended per ETSI
 * TS 119 472-1 v1.2.1 §6.
 *
 * The wire format is CBOR. The top-level structure is `IssuerSigned`
 * (ISO 18013-5 §8.3.2.1.2.2):
 *
 *   IssuerSigned = {
 *     "nameSpaces": IssuerNameSpaces,
 *     "issuerAuth": IssuerAuth
 *   }
 *
 * `IssuerAuth` is a COSE_Sign1 four-element array (RFC 9052):
 * `[protected_bstr, unprotected_map, payload_bstr, signature_bstr]`.
 *
 * The COSE payload bstr is a CBOR-encoded `tag(24)` whose inner bstr
 * is the encoded `MobileSecurityObject`. The MSO carries digest
 * algorithm, value digests, validity info, device key, status etc.
 *
 * Each entry in `nameSpaces[ns]` is a `tag(24)`-wrapped
 * IssuerSignedItem; we unwrap each one so callers see plain JS objects.
 *
 * Cryptographic signature verification is deferred. This parser only
 * decodes the structure; checks that need the cert chain or the
 * signature read them off `issuerAuth.protectedHeader` / `signature`.
 */

import { Decoder, Tag } from 'cbor-x';
import { ParseError } from './sd-jwt-vc';

export interface IssuerSignedItem {
  digestID: number;
  random: Uint8Array;
  elementIdentifier: string;
  elementValue: unknown;
}

export interface MobileSecurityObject {
  version: string;
  digestAlgorithm: string;
  valueDigests: Record<string, Record<number, Uint8Array>>;
  deviceKeyInfo: { deviceKey: unknown };
  docType: string;
  validityInfo: {
    signed?: Date;
    validFrom: Date;
    validUntil: Date;
  };
  // ETSI TS 119 472-1 v1.2.1 §6 extensions, namespaced
  // org.etsi.01947201.010101 on the wire but lifted into named fields
  // here for ergonomic check authoring.
  status?: Record<string, unknown>;
  shortLived?: boolean;
  oneTime?: boolean;
  category?: string;
  iss_reg_id?: string;
  also_known_as?: string;
}

export interface ParsedMdoc {
  docType: string;
  nameSpaces: Record<string, IssuerSignedItem[]>;
  issuerAuth: {
    protectedHeader: {
      alg?: number;
      x5chain?: Uint8Array[];
      x5u?: string;
      x5t?: Uint8Array;
    };
    unprotectedHeader: Record<string, unknown>;
    payload: Uint8Array;
    signature: Uint8Array;
    mso: MobileSecurityObject;
  };
}

const decoder = new Decoder({ mapsAsObjects: true, useRecords: false });

function decode(bytes: Uint8Array): unknown {
  return decoder.decode(bytes as Buffer);
}

function isUint8Array(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function bytesFromString(input: string): Uint8Array {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new ParseError('mdoc input is empty');
  }
  // Hex: only [0-9a-fA-F], even length.
  const compact = trimmed.replace(/\s+/g, '');
  if (/^[0-9a-fA-F]+$/.test(compact) && compact.length % 2 === 0) {
    return Buffer.from(compact, 'hex');
  }
  // Base64 or base64url. Replace url-safe chars then pad and decode.
  if (/^[A-Za-z0-9+/_=-]+$/.test(compact)) {
    const standard = compact.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (standard.length % 4)) % 4;
    return Buffer.from(standard + '='.repeat(pad), 'base64');
  }
  throw new ParseError(
    'mdoc string input must be hex or base64-encoded CBOR bytes',
  );
}

function decodeProtectedHeader(
  bstr: Uint8Array,
): ParsedMdoc['issuerAuth']['protectedHeader'] {
  if (bstr.length === 0) {
    return {};
  }
  let raw: unknown;
  try {
    raw = decode(bstr);
  } catch (err) {
    throw new ParseError(
      `COSE protected header could not be decoded: ${(err as Error).message}`,
    );
  }
  if (!isPlainObject(raw)) {
    throw new ParseError('COSE protected header must be a CBOR map');
  }
  // Header parameter integer keys per IETF RFC 9052 / RFC 9360.
  // cbor-x with mapsAsObjects:true stringifies integer keys.
  const out: ParsedMdoc['issuerAuth']['protectedHeader'] = {};
  if (typeof raw['1'] === 'number' || typeof raw[1] === 'number') {
    out.alg = (raw['1'] ?? raw[1]) as number;
  }
  const x5chain = raw['33'] ?? raw[33];
  if (Array.isArray(x5chain) && x5chain.every(isUint8Array)) {
    out.x5chain = x5chain;
  } else if (isUint8Array(x5chain)) {
    out.x5chain = [x5chain];
  }
  const x5u = raw['35'] ?? raw[35];
  if (typeof x5u === 'string') {
    out.x5u = x5u;
  }
  const x5t = raw['34'] ?? raw[34];
  if (isUint8Array(x5t)) {
    out.x5t = x5t;
  } else if (Array.isArray(x5t) && x5t.length === 2 && isUint8Array(x5t[1])) {
    // x5t per RFC 9360 is `[alg, hash]`; pluck the hash.
    out.x5t = x5t[1] as Uint8Array;
  }
  return out;
}

function unwrapTag24(value: unknown, what: string): Uint8Array {
  if (!(value instanceof Tag) || value.tag !== 24) {
    throw new ParseError(
      `${what} must be a CBOR tag(24) wrapping an embedded byte string`,
    );
  }
  if (!isUint8Array(value.value)) {
    throw new ParseError(`${what} tag(24) value must be a byte string`);
  }
  return value.value;
}

function ensureDate(value: unknown, field: string): Date {
  if (value instanceof Date) return value;
  throw new ParseError(`MobileSecurityObject.validityInfo.${field} is not a date`);
}

function decodeMso(payloadBstr: Uint8Array): MobileSecurityObject {
  // The COSE payload bstr is itself a CBOR-encoded tag(24)(bstr).
  let outer: unknown;
  try {
    outer = decode(payloadBstr);
  } catch (err) {
    throw new ParseError(
      `MobileSecurityObject envelope could not be decoded: ${(err as Error).message}`,
    );
  }
  const innerBytes = unwrapTag24(outer, 'MobileSecurityObject');
  let raw: unknown;
  try {
    raw = decode(innerBytes);
  } catch (err) {
    throw new ParseError(
      `MobileSecurityObject contents could not be decoded: ${(err as Error).message}`,
    );
  }
  if (!isPlainObject(raw)) {
    throw new ParseError('MobileSecurityObject must be a CBOR map');
  }
  if (typeof raw.version !== 'string') {
    throw new ParseError('MobileSecurityObject.version is missing or not a string');
  }
  if (typeof raw.digestAlgorithm !== 'string') {
    throw new ParseError(
      'MobileSecurityObject.digestAlgorithm is missing or not a string',
    );
  }
  if (typeof raw.docType !== 'string') {
    throw new ParseError('MobileSecurityObject.docType is missing or not a string');
  }
  if (!isPlainObject(raw.valueDigests)) {
    throw new ParseError('MobileSecurityObject.valueDigests must be a CBOR map');
  }
  if (!isPlainObject(raw.deviceKeyInfo)) {
    throw new ParseError('MobileSecurityObject.deviceKeyInfo must be a CBOR map');
  }
  if (!isPlainObject(raw.validityInfo)) {
    throw new ParseError('MobileSecurityObject.validityInfo must be a CBOR map');
  }

  // valueDigests inner keys are digestIDs (integers) which cbor-x has
  // stringified; coerce them back to numbers for typed access.
  const valueDigests: Record<string, Record<number, Uint8Array>> = {};
  for (const [ns, perId] of Object.entries(raw.valueDigests)) {
    if (!isPlainObject(perId)) continue;
    const out: Record<number, Uint8Array> = {};
    for (const [id, digest] of Object.entries(perId)) {
      const n = Number(id);
      if (!Number.isInteger(n)) continue;
      if (!isUint8Array(digest)) continue;
      out[n] = digest;
    }
    valueDigests[ns] = out;
  }

  const validityInfo = raw.validityInfo as Record<string, unknown>;
  const mso: MobileSecurityObject = {
    version: raw.version,
    digestAlgorithm: raw.digestAlgorithm,
    valueDigests,
    deviceKeyInfo: raw.deviceKeyInfo as { deviceKey: unknown },
    docType: raw.docType,
    validityInfo: {
      validFrom: ensureDate(validityInfo.validFrom, 'validFrom'),
      validUntil: ensureDate(validityInfo.validUntil, 'validUntil'),
      ...(validityInfo.signed instanceof Date ? { signed: validityInfo.signed } : {}),
    },
  };
  // ETSI extensions: lift into typed fields when present.
  if (isPlainObject(raw.status)) mso.status = raw.status as Record<string, unknown>;
  if (typeof raw.shortLived === 'boolean') mso.shortLived = raw.shortLived;
  if (typeof raw.oneTime === 'boolean') mso.oneTime = raw.oneTime;
  if (typeof raw.category === 'string') mso.category = raw.category;
  if (typeof raw.iss_reg_id === 'string') mso.iss_reg_id = raw.iss_reg_id;
  if (typeof raw.also_known_as === 'string') mso.also_known_as = raw.also_known_as;
  return mso;
}

function decodeNameSpaces(raw: unknown): Record<string, IssuerSignedItem[]> {
  if (!isPlainObject(raw)) {
    throw new ParseError('IssuerSigned.nameSpaces must be a CBOR map');
  }
  const out: Record<string, IssuerSignedItem[]> = {};
  for (const [ns, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) {
      throw new ParseError(
        `IssuerSigned.nameSpaces[${JSON.stringify(ns)}] must be a CBOR array`,
      );
    }
    out[ns] = list.map((entry, idx): IssuerSignedItem => {
      const innerBytes = unwrapTag24(
        entry,
        `IssuerSigned.nameSpaces[${JSON.stringify(ns)}][${idx}]`,
      );
      let item: unknown;
      try {
        item = decode(innerBytes);
      } catch (err) {
        throw new ParseError(
          `IssuerSignedItem at ${ns}[${idx}] could not be decoded: ${(err as Error).message}`,
        );
      }
      if (!isPlainObject(item)) {
        throw new ParseError(
          `IssuerSignedItem at ${ns}[${idx}] must be a CBOR map`,
        );
      }
      if (typeof item.digestID !== 'number') {
        throw new ParseError(
          `IssuerSignedItem.digestID missing at ${ns}[${idx}]`,
        );
      }
      if (!isUint8Array(item.random)) {
        throw new ParseError(
          `IssuerSignedItem.random missing or not a byte string at ${ns}[${idx}]`,
        );
      }
      if (typeof item.elementIdentifier !== 'string') {
        throw new ParseError(
          `IssuerSignedItem.elementIdentifier missing at ${ns}[${idx}]`,
        );
      }
      return {
        digestID: item.digestID,
        random: item.random,
        elementIdentifier: item.elementIdentifier,
        elementValue: item.elementValue,
      };
    });
  }
  return out;
}

export function parseMdoc(input: string | Uint8Array): ParsedMdoc {
  const bytes = typeof input === 'string' ? bytesFromString(input) : input;
  if (!isUint8Array(bytes) || bytes.length === 0) {
    throw new ParseError('mdoc input must be non-empty bytes');
  }

  let outer: unknown;
  try {
    outer = decode(bytes);
  } catch (err) {
    throw new ParseError(
      `mdoc CBOR could not be decoded: ${(err as Error).message}`,
    );
  }
  if (!isPlainObject(outer)) {
    throw new ParseError('mdoc top-level value must be a CBOR map');
  }
  const issuerAuthRaw = outer.issuerAuth;
  const nameSpacesRaw = outer.nameSpaces;
  if (issuerAuthRaw === undefined) {
    throw new ParseError('mdoc IssuerSigned is missing the issuerAuth member');
  }
  if (nameSpacesRaw === undefined) {
    throw new ParseError('mdoc IssuerSigned is missing the nameSpaces member');
  }

  if (!Array.isArray(issuerAuthRaw) || issuerAuthRaw.length !== 4) {
    throw new ParseError(
      'IssuerSigned.issuerAuth must be a four-element COSE_Sign1 array',
    );
  }
  const [protectedBstr, unprotectedRaw, payloadBstr, signatureBstr] = issuerAuthRaw;
  if (!isUint8Array(protectedBstr)) {
    throw new ParseError('COSE_Sign1[0] (protected) must be a byte string');
  }
  if (!isUint8Array(payloadBstr)) {
    throw new ParseError('COSE_Sign1[2] (payload) must be a byte string');
  }
  if (!isUint8Array(signatureBstr)) {
    throw new ParseError('COSE_Sign1[3] (signature) must be a byte string');
  }
  const unprotectedHeader = isPlainObject(unprotectedRaw) ? unprotectedRaw : {};

  const protectedHeader = decodeProtectedHeader(protectedBstr);
  const mso = decodeMso(payloadBstr);
  const nameSpaces = decodeNameSpaces(nameSpacesRaw);

  return {
    docType: mso.docType,
    nameSpaces,
    issuerAuth: {
      protectedHeader,
      unprotectedHeader,
      payload: payloadBstr,
      signature: signatureBstr,
      mso,
    },
  };
}
