import type { ParsedEvidence } from '@iwc/shared';
import type { AssessmentScope, Verdict } from '../types';
import type { CheckExtras } from '../registry';

const CONTROL_ID = 'EAA-5.2.10.1-11';
const EVIDENCE_REF = 'eaa-payload';

function isUrl(value: string): boolean {
  try {
    // URL constructor throws on invalid input. Restrict to http/https for
    // practical use; the spec allows any URL but a status URI must be
    // dereferenceable.
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * EAA-5.2.10.1-11: When the status component is present, status.uri shall
 * be a JSON string whose value is a URL pointing to the status list.
 */
export async function check(
  evidence: ParsedEvidence,
  _scope: AssessmentScope,
  _extras: CheckExtras,
): Promise<Verdict> {
  if (evidence.kind !== 'sd-jwt-vc') {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'Check applies to SD-JWT VC evidence only.',
    };
  }
  const { payload } = evidence.parsed;
  const status = payload['status'];
  if (status === undefined || status === null) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component absent; rule applies only when status is present.',
    };
  }
  if (typeof status !== 'object' || Array.isArray(status)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status component is present but not a JSON object. Expected the ETSI flat shape `{ status: { type, purpose, index, uri } }` or the IETF nested envelope `{ status: { status_list: { idx, uri } } }`.',
    };
  }
  const uri = (status as Record<string, unknown>)['uri'];
  if (uri === undefined) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.uri absent; rule applies only when status.uri is present.',
    };
  }
  if (typeof uri !== 'string' || uri.length === 0) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: 'status.uri is present but is not a non-empty JSON string. Expected an absolute http(s) URL pointing to the status-list endpoint, e.g. "https://issuer.example/status-lists/eaa-1".',
    };
  }
  if (!isUrl(uri)) {
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `status.uri is not a valid http(s) URL: "${uri}". Expected an absolute http(s) URL pointing to the status-list endpoint, e.g. "https://issuer.example/status-lists/eaa-1". Relative URIs, mailto:/data:/file: and other non-http(s) schemes are rejected because the URI must be dereferenceable by a verifier.`,
    };
  }
  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: `status.uri is a valid URL: ${uri}`,
  };
}

export const controlId = CONTROL_ID;
