import type { ParsedMdoc } from '@iwc/shared';

/**
 * Canonical namespace identifiers used by ISO/IEC 18013-5 mdoc / mDL
 * credentials, ISO/IEC 23220-2 non-mDL mdocs, and the ETSI extension
 * namespace for new data elements introduced by TS 119 472-1 v1.2.1 §6.
 */
export const MDL_DOC_TYPE = 'org.iso.18013.5.1.mDL';
export const NS_MDL = 'org.iso.18013.5.1';
export const NS_ISO_23220 = 'org.iso.23220.1';
export const NS_ETSI = 'org.etsi.01947201.010101';

/** Per QEAA-4.2.2.2-02. */
export const URN_QEAA = 'urn:etsi:esi:eaa:eu:qualified';
/** Per PuB-EAA-4.2.2.3-02. */
export const URN_PUB_EAA = 'urn:etsi:esi:eaa:eu:pub';

/** True when the credential's docType marks it as an ISO/IEC 18013-5 mDL. */
export function isMdl(parsed: ParsedMdoc): boolean {
  return parsed.docType === MDL_DOC_TYPE;
}

/** Namespace where the standard mDL or ISO 23220-2 data elements live for this credential. */
export function primaryNamespace(parsed: ParsedMdoc): string {
  return isMdl(parsed) ? NS_MDL : NS_ISO_23220;
}

/**
 * Look up a single IssuerSignedItem in the named namespace by element
 * identifier. Returns the elementValue (whatever JS shape the CBOR
 * decoded to) or undefined when the namespace is missing or the
 * identifier is not present.
 */
export function findElement(
  parsed: ParsedMdoc,
  namespace: string,
  identifier: string,
): unknown {
  const items = parsed.nameSpaces[namespace];
  if (!items) return undefined;
  const item = items.find((i) => i.elementIdentifier === identifier);
  return item?.elementValue;
}

/** True when the namespace contains an item with the given identifier. */
export function hasElement(
  parsed: ParsedMdoc,
  namespace: string,
  identifier: string,
): boolean {
  return findElement(parsed, namespace, identifier) !== undefined;
}

/**
 * Search every namespace for an element with the given identifier and
 * return the first match's value (and the namespace it lived in).
 * Useful for elements that may legitimately appear in either the
 * primary mdoc/23220-2 namespace or the ETSI namespace, depending on
 * the issuer.
 */
export function findElementAnyNs(
  parsed: ParsedMdoc,
  identifier: string,
): { namespace: string; value: unknown } | undefined {
  for (const [ns, items] of Object.entries(parsed.nameSpaces)) {
    const item = items.find((i) => i.elementIdentifier === identifier);
    if (item) return { namespace: ns, value: item.elementValue };
  }
  return undefined;
}
