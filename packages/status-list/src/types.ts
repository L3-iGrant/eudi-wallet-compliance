/**
 * Token Status List types per IETF draft-ietf-oauth-status-list-13.
 *
 * A status list is a compact bitstring identified by an URI. Each credential
 * carrying a status reference points at one bit position within the list; the
 * list itself is published as either a JWT or a CWT.
 */

export type StatusListFormat = 'jwt' | 'cwt';

export interface StatusList {
  /** Wire format the list arrived in. */
  format: StatusListFormat;
  /** Issuer claim from the JWT/CWT envelope (iss / claim 1). */
  issuer: string;
  /**
   * Decompressed status bitstring. Bytes are big-endian; bit 0 is the MSB of
   * byte 0 per the draft.
   */
  statusListBits: Uint8Array;
  /** 1, 2, 4, or 8 bits per status entry. */
  bitsPerStatus: number;
}

/**
 * Status values. 0/1/2/3 are registered by the draft; higher integers are
 * permitted but reserved for future or application-specific use.
 */
export type StatusValue = number;

export const STATUS_VALID = 0;
export const STATUS_INVALID = 1;
export const STATUS_SUSPENDED = 2;

export interface VerificationResult {
  ok: boolean;
  reasons: string[];
}
