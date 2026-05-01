import type { StatusList, VerificationResult } from './types';

/**
 * Confirm the issuer claim of the status list matches what the calling
 * credential expects. Signature verification is intentionally deferred until
 * trust-list resolution lands; for now this is purely a metadata check.
 */
export function verifyStatusList(
  list: StatusList,
  expectedIssuer?: string,
): VerificationResult {
  const reasons: string[] = [];
  if (expectedIssuer && list.issuer !== expectedIssuer) {
    reasons.push(
      `status list issuer "${list.issuer}" does not match expected "${expectedIssuer}"`,
    );
  }
  return { ok: reasons.length === 0, reasons };
}
