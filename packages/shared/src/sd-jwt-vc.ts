/**
 * Parses an SD-JWT VC compact serialisation into its structural parts.
 *
 * Compact serialisation per IETF SD-JWT (draft-ietf-oauth-selective-disclosure-jwt):
 *   <JWS>~<Disclosure1>~...<DisclosureN>~                   (Issuance form)
 *   <JWS>~<Disclosure1>~...<DisclosureN>~<KB-JWT>           (Presentation form)
 *
 * <JWS> is itself <base64url-header>.<base64url-payload>.<base64url-signature>.
 *
 * Decoding individual disclosures (each a base64url-encoded JSON array) is
 * left to the caller; this helper only returns the raw disclosure strings.
 */

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export interface ParsedSdJwtVc {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  /** Raw base64url-encoded signature segment of the JWS. */
  signature: string;
  /** Raw disclosure strings (each base64url-encoded JSON array). */
  disclosures: string[];
  /** Key Binding JWT (raw, three-segment base64url JWS), present only in the Presentation form. */
  keyBinding?: string;
}

function base64UrlDecodeBytes(input: string): Uint8Array {
  if (input.length === 0) {
    throw new ParseError('Empty base64url segment');
  }
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (s.length % 4)) % 4;
  s += '='.repeat(pad);
  let binary: string;
  try {
    binary = atob(s);
  } catch {
    throw new ParseError('Invalid base64url encoding');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeJsonSegment(input: string, label: string): Record<string, unknown> {
  const bytes = base64UrlDecodeBytes(input);
  const text = new TextDecoder().decode(bytes);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new ParseError(
      `${label} is not valid JSON: ${(err as Error).message}`,
    );
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ParseError(`${label} must decode to a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

export function parseSdJwtVc(compact: string): ParsedSdJwtVc {
  if (typeof compact !== 'string' || compact.length === 0) {
    throw new ParseError('SD-JWT VC compact serialisation must be a non-empty string');
  }
  if (!compact.includes('~')) {
    throw new ParseError(
      'SD-JWT VC compact serialisation must contain at least one "~" separator',
    );
  }

  const segments = compact.split('~');
  const jws = segments[0] ?? '';
  const last = segments[segments.length - 1] ?? '';

  let disclosures: string[];
  let keyBinding: string | undefined;
  if (last === '') {
    // Issuance form: trailing "~" with no key binding.
    disclosures = segments.slice(1, -1);
    keyBinding = undefined;
  } else {
    // Presentation form: last segment is the KB-JWT.
    disclosures = segments.slice(1, -1);
    keyBinding = last;
  }

  const jwsParts = jws.split('.');
  if (jwsParts.length !== 3) {
    throw new ParseError(
      'JWS must have exactly three "." separated segments',
    );
  }
  const [headerSeg, payloadSeg, signatureSeg] = jwsParts;
  if (!headerSeg || !payloadSeg || !signatureSeg) {
    throw new ParseError('JWS segments must be non-empty');
  }

  return {
    header: decodeJsonSegment(headerSeg, 'JWS header'),
    payload: decodeJsonSegment(payloadSeg, 'JWS payload'),
    signature: signatureSeg,
    disclosures,
    keyBinding,
  };
}
