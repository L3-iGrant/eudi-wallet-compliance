/**
 * Status component shape detector / normaliser.
 *
 * ETSI TS 119 472-1 §5.2.10.1 defines `status` as a flat JSON object
 * carrying `type`, `purpose`, `index` and `uri` directly. The same
 * clause references IETF draft-ietf-oauth-status-list-13, whose own
 * envelope nests `idx` and `uri` under a `status_list` member. To
 * accept tokens issued against the IETF draft as conformant for the
 * member-presence checks (-04, -06, -08, -10) and the runtime
 * resolver (-5.2.10.2-01), we surface both shapes through a single
 * normalised view.
 *
 * `shape` is the wire form encountered:
 *   - 'flat'        : ETSI shape; type/purpose/index/uri are top-level
 *   - 'ietf-nested' : IETF shape; idx/uri live under status_list
 *   - 'absent'      : status claim missing
 *   - 'invalid'     : status is present but not a JSON Object
 *
 * `type`/`purpose`/`index`/`uri` are populated from whichever shape is
 * present. The IETF draft does not define `type` or `purpose`, so for
 * `ietf-nested` they remain `undefined`.
 */
export interface NormalisedStatus {
  shape: 'flat' | 'ietf-nested' | 'absent' | 'invalid';
  type?: unknown;
  purpose?: unknown;
  index?: unknown;
  uri?: unknown;
  raw: Record<string, unknown> | null;
}

export function normaliseStatus(payload: Record<string, unknown>): NormalisedStatus {
  const status = payload['status'];
  if (status === undefined || status === null) {
    return { shape: 'absent', raw: null };
  }
  if (typeof status !== 'object' || Array.isArray(status)) {
    return { shape: 'invalid', raw: null };
  }
  const obj = status as Record<string, unknown>;
  // Any of the ETSI top-level members signals the flat shape, even
  // partially. A token mixing both forms is read as flat so the spec
  // semantics win.
  const hasFlat =
    'type' in obj || 'purpose' in obj || 'index' in obj || 'uri' in obj;
  const nested = obj['status_list'];
  const nestedIsObj =
    nested !== undefined &&
    nested !== null &&
    typeof nested === 'object' &&
    !Array.isArray(nested);
  if (!hasFlat && nestedIsObj) {
    const n = nested as Record<string, unknown>;
    return {
      shape: 'ietf-nested',
      type: undefined,
      purpose: undefined,
      index: n['idx'],
      uri: n['uri'],
      raw: obj,
    };
  }
  return {
    shape: 'flat',
    type: obj['type'],
    purpose: obj['purpose'],
    index: obj['index'],
    uri: obj['uri'],
    raw: obj,
  };
}
