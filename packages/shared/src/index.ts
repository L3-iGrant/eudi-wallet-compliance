import { parseSdJwtVc, ParseError, type ParsedSdJwtVc } from './sd-jwt-vc';
import {
  parseMdoc,
  type IssuerSignedItem,
  type MobileSecurityObject,
  type ParsedMdoc,
} from './mdoc';

export {
  parseSdJwtVc,
  ParseError,
  type ParsedSdJwtVc,
} from './sd-jwt-vc';

export {
  parseMdoc,
  type IssuerSignedItem,
  type MobileSecurityObject,
  type ParsedMdoc,
} from './mdoc';

/**
 * Tagged-union representation of a successfully-parsed EAA payload.
 *
 * Phase 7 introduces this type so the engine can lift parsing up to
 * runAssessment (instead of every check re-parsing the same compact
 * serialisation). Each per-control check narrows on `kind` and dispatches
 * accordingly; checks that apply to only one profile return na for the
 * other.
 */
export type ParsedEvidence =
  | { kind: 'sd-jwt-vc'; parsed: ParsedSdJwtVc }
  | { kind: 'mdoc'; parsed: ParsedMdoc };

function looksLikeSdJwtCompact(s: string): boolean {
  // Compact SD-JWT VC: <header>.<payload>.<signature>[~disclosure...][~kbjwt]
  // The first '~'-segment must be three base64url chunks separated by '.'.
  const first = s.split('~')[0] ?? '';
  const parts = first.split('.');
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0 && /^[A-Za-z0-9_-]+$/.test(p));
}

/**
 * Sniff the input format and parse accordingly. Throws ParseError when
 * the input is neither an SD-JWT VC compact serialisation nor a
 * recognisable mdoc CBOR (hex or base64-encoded).
 */
export function parseEvidence(input: string): ParsedEvidence {
  if (typeof input !== 'string') {
    throw new ParseError('Evidence input must be a string');
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new ParseError('Evidence input is empty');
  }
  if (looksLikeSdJwtCompact(trimmed)) {
    return { kind: 'sd-jwt-vc', parsed: parseSdJwtVc(trimmed) };
  }
  try {
    return { kind: 'mdoc', parsed: parseMdoc(trimmed) };
  } catch {
    throw new ParseError(
      'Input is neither SD-JWT VC compact serialisation nor mdoc CBOR (hex or base64)',
    );
  }
}

/**
 * Convert a control id like "EAA-5.2.10.1-04" or "PuB-EAA-5.6.3-02" into a
 * URL-safe slug: lowercase, dots replaced with dashes. Round-trip via
 * slugToControlId() requires the original catalogue.
 */
export function controlIdToSlug(id: string): string {
  return id.toLowerCase().replace(/\./g, '-');
}

/**
 * Resolve a slug back to its canonical control id by looking it up in the
 * supplied catalogue. Returns null if no entry matches.
 */
export function slugToControlId(
  slug: string,
  controls: ReadonlyArray<{ id: string }>,
): string | null {
  const normalised = slug.toLowerCase();
  const match = controls.find((c) => controlIdToSlug(c.id) === normalised);
  return match?.id ?? null;
}
