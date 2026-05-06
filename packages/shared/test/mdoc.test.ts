import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { Encoder, Tag } from 'cbor-x';
import { parseMdoc, ParseError, parseEvidence } from '../src';

const FIXTURE_PATH = join(
  fileURLToPath(new URL('./__fixtures__/', import.meta.url)),
  'mdl-eaa-1.cbor',
);

const encoder = new Encoder({ mapsAsObjects: true, useRecords: false });

async function loadFixture(): Promise<Uint8Array> {
  return new Uint8Array(await readFile(FIXTURE_PATH));
}

describe('parseMdoc: positive', () => {
  it('parses the MDL-EAA-1 reference fixture into a ParsedMdoc', async () => {
    const bytes = await loadFixture();
    const parsed = parseMdoc(bytes);

    expect(parsed.docType).toBe('eu.europa.ec.eudi.pid.1');
    expect(Object.keys(parsed.nameSpaces)).toContain('eu.europa.ec.eudi.pid.1');

    const items = parsed.nameSpaces['eu.europa.ec.eudi.pid.1'];
    expect(items).toBeDefined();
    expect(items!.length).toBeGreaterThan(0);
    const first = items![0]!;
    expect(typeof first.digestID).toBe('number');
    expect(first.random).toBeInstanceOf(Uint8Array);
    expect(typeof first.elementIdentifier).toBe('string');

    const { mso } = parsed.issuerAuth;
    expect(mso.version).toBe('1.0');
    expect(mso.digestAlgorithm).toBe('SHA-256');
    expect(mso.docType).toBe('eu.europa.ec.eudi.pid.1');
    expect(mso.validityInfo.validFrom).toBeInstanceOf(Date);
    expect(mso.validityInfo.validUntil).toBeInstanceOf(Date);
    expect(mso.validityInfo.validFrom.getTime()).toBeLessThanOrEqual(
      mso.validityInfo.validUntil.getTime(),
    );
    expect(Object.keys(mso.valueDigests)).toContain('eu.europa.ec.eudi.pid.1');
    const digestsForNs = mso.valueDigests['eu.europa.ec.eudi.pid.1'];
    expect(digestsForNs).toBeDefined();
    expect(Object.keys(digestsForNs!).length).toBeGreaterThan(0);
    for (const v of Object.values(digestsForNs!)) {
      expect(v).toBeInstanceOf(Uint8Array);
    }

    expect(parsed.issuerAuth.signature).toBeInstanceOf(Uint8Array);
    expect(parsed.issuerAuth.payload).toBeInstanceOf(Uint8Array);
    // The MDL-EAA-1 fixture only carries `alg` in the protected header.
    expect(parsed.issuerAuth.protectedHeader.alg).toBeTypeOf('number');
  });

  it('accepts hex-encoded input', async () => {
    const bytes = await loadFixture();
    const hex = Buffer.from(bytes).toString('hex');
    const parsed = parseMdoc(hex);
    expect(parsed.docType).toBe('eu.europa.ec.eudi.pid.1');
  });

  it('accepts base64-encoded input', async () => {
    const bytes = await loadFixture();
    const b64 = Buffer.from(bytes).toString('base64');
    const parsed = parseMdoc(b64);
    expect(parsed.docType).toBe('eu.europa.ec.eudi.pid.1');
  });
});

describe('parseMdoc: negative', () => {
  it('rejects truncated CBOR mid-IssuerSigned', async () => {
    const bytes = await loadFixture();
    const truncated = bytes.slice(0, 100);
    expect(() => parseMdoc(truncated)).toThrow(ParseError);
  });

  it('rejects a three-element COSE_Sign1', async () => {
    const bytes = await loadFixture();
    const parsed = parseMdoc(bytes);
    // Reconstruct the IssuerSigned map but truncate issuerAuth to 3 elts.
    const broken = encoder.encode({
      issuerAuth: [
        Buffer.alloc(0),
        {},
        parsed.issuerAuth.payload,
      ],
      nameSpaces: {},
    });
    expect(() => parseMdoc(broken)).toThrow(/four-element COSE_Sign1/);
  });

  it('rejects when the COSE payload is not a tag(24) wrapper', async () => {
    const bytes = await loadFixture();
    const parsed = parseMdoc(bytes);
    // Replace the payload bstr with bytes that are NOT a tag(24).
    // Use a CBOR-encoded plain map instead.
    const plainMap = encoder.encode({ docType: 'x' });
    const broken = encoder.encode({
      issuerAuth: [
        Buffer.alloc(0),
        {},
        plainMap,
        parsed.issuerAuth.signature,
      ],
      nameSpaces: parsed.nameSpaces,
    });
    expect(() => parseMdoc(broken)).toThrow(/tag\(24\)/);
  });

  it('rejects garbage strings', () => {
    expect(() => parseMdoc('not really hex or base64 ###')).toThrow(ParseError);
  });

  it('rejects empty input', () => {
    expect(() => parseMdoc('')).toThrow(ParseError);
    expect(() => parseMdoc(new Uint8Array(0))).toThrow(ParseError);
  });
});

describe('parseEvidence dispatch', () => {
  it('routes SD-JWT VC compact serialisations to kind: sd-jwt-vc', () => {
    // Build a syntactically-valid SD-JWT VC compact: three base64url
    // segments separated by dots, plus a trailing tilde.
    const b64 = (obj: object) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    const compact = `${b64({ alg: 'none' })}.${b64({ vct: 'urn:test/v1' })}.placeholder~`;
    const parsed = parseEvidence(compact);
    expect(parsed.kind).toBe('sd-jwt-vc');
  });

  it('routes mdoc base64 to kind: mdoc', async () => {
    const bytes = await loadFixture();
    const b64 = Buffer.from(bytes).toString('base64');
    const parsed = parseEvidence(b64);
    expect(parsed.kind).toBe('mdoc');
    if (parsed.kind === 'mdoc') {
      expect(parsed.parsed.docType).toBe('eu.europa.ec.eudi.pid.1');
    }
  });

  it('routes mdoc hex to kind: mdoc', async () => {
    const bytes = await loadFixture();
    const hex = Buffer.from(bytes).toString('hex');
    const parsed = parseEvidence(hex);
    expect(parsed.kind).toBe('mdoc');
  });

  it('throws ParseError for an unrecognised string', () => {
    expect(() => parseEvidence('hello world this is not valid')).toThrow(
      ParseError,
    );
  });

  it('throws ParseError for empty input', () => {
    expect(() => parseEvidence('')).toThrow(ParseError);
    expect(() => parseEvidence('   ')).toThrow(ParseError);
  });
});
