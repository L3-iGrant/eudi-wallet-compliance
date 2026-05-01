import { describe, it, expect } from 'vitest';
import { parseSdJwtVc, ParseError } from '../src/sd-jwt-vc';

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeJws(header: object, payload: object, signature = 'sig'): string {
  return [
    base64UrlEncode(JSON.stringify(header)),
    base64UrlEncode(JSON.stringify(payload)),
    signature,
  ].join('.');
}

const sampleHeader = { alg: 'ES256', typ: 'vc+sd-jwt' };
const samplePayload = { iss: 'https://issuer.example', vct: 'example/v1' };

describe('parseSdJwtVc', () => {
  it('parses the issuance form (trailing tilde, no key binding)', () => {
    const jws = makeJws(sampleHeader, samplePayload);
    const compact = `${jws}~D1~D2~`;
    const parsed = parseSdJwtVc(compact);
    expect(parsed.header).toEqual(sampleHeader);
    expect(parsed.payload).toEqual(samplePayload);
    expect(parsed.signature).toBe('sig');
    expect(parsed.disclosures).toEqual(['D1', 'D2']);
    expect(parsed.keyBinding).toBeUndefined();
  });

  it('parses the presentation form (key binding present)', () => {
    const jws = makeJws(sampleHeader, samplePayload);
    const compact = `${jws}~D1~D2~kbjwt`;
    const parsed = parseSdJwtVc(compact);
    expect(parsed.disclosures).toEqual(['D1', 'D2']);
    expect(parsed.keyBinding).toBe('kbjwt');
  });

  it('parses an issuance form with no disclosures', () => {
    const jws = makeJws(sampleHeader, samplePayload);
    const compact = `${jws}~`;
    const parsed = parseSdJwtVc(compact);
    expect(parsed.disclosures).toEqual([]);
    expect(parsed.keyBinding).toBeUndefined();
  });

  it('throws ParseError on empty input', () => {
    expect(() => parseSdJwtVc('')).toThrow(ParseError);
  });

  it('throws ParseError when the "~" separator is missing', () => {
    const jws = makeJws(sampleHeader, samplePayload);
    expect(() => parseSdJwtVc(jws)).toThrow(/"~" separator/);
  });

  it('throws ParseError when the JWS has the wrong number of segments', () => {
    expect(() => parseSdJwtVc('a.b~')).toThrow(/three "\." separated/);
  });

  it('throws ParseError when the header segment is not valid JSON', () => {
    const compact = `${base64UrlEncode('not-json')}.${base64UrlEncode(
      JSON.stringify(samplePayload),
    )}.sig~`;
    expect(() => parseSdJwtVc(compact)).toThrow(/header is not valid JSON/);
  });

  it('throws ParseError when the payload decodes to a non-object', () => {
    const compact = `${base64UrlEncode(JSON.stringify(sampleHeader))}.${base64UrlEncode(
      JSON.stringify(['array', 'not', 'object']),
    )}.sig~`;
    expect(() => parseSdJwtVc(compact)).toThrow(/payload must decode to a JSON object/);
  });
});
