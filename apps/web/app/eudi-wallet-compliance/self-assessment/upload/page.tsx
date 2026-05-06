'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { AssessmentScope, Evidence } from '@iwc/engine';
import {
  parseEvidence,
  type ParsedEvidence,
  type ParsedMdoc,
  type ParsedSdJwtVc,
} from '@iwc/shared';
import { getSampleByIdSync } from '@iwc/controls/sync';
import { runAssessmentAction } from '../../../actions/run-assessment';

const PROFILE_LABEL: Record<string, string> = {
  'sd-jwt-vc': 'SD-JWT VC',
  mdoc: 'ISO mdoc',
};

const ROLE_LABEL: Record<string, string> = {
  issuer: 'Issuer',
  verifier: 'Verifier',
};

const TIER_LABEL: Record<string, string> = {
  ordinary: 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
};

function tryParseEvidence(s: string): ParsedEvidence | null {
  if (!s || !s.trim()) return null;
  try {
    return parseEvidence(s.trim());
  } catch {
    return null;
  }
}

function isValidEvidenceInput(s: string): boolean {
  return tryParseEvidence(s) !== null;
}

function isJsonOrEmpty(s: string | undefined): boolean {
  if (!s || !s.trim()) return true;
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

function base64UrlToBytes(input: string): Uint8Array {
  const s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (s.length % 4)) % 4;
  const binary = atob(s + '='.repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function derBase64ToPem(b64: string): string {
  // RFC 7515 §4.1.6: x5c entries are standard base64-encoded DER (no PEM
  // armour, no line breaks). Wrap to 64-char lines and add the headers.
  const stripped = b64.replace(/\s+/g, '');
  const lines = stripped.match(/.{1,64}/g)?.join('\n') ?? stripped;
  return `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----`;
}

function extractStatusUri(payload: Record<string, unknown>): string | null {
  const status = payload['status'];
  if (!status || typeof status !== 'object' || Array.isArray(status)) return null;
  const obj = status as Record<string, unknown>;
  if (typeof obj['uri'] === 'string' && obj['uri'].length > 0) return obj['uri'];
  // IETF Token Status List nests the URI one level deeper under
  // `status_list`; honour that shape as a fallback.
  const nested = obj['status_list'];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const uri = (nested as Record<string, unknown>)['uri'];
    if (typeof uri === 'string' && uri.length > 0) return uri;
  }
  return null;
}

function extractTypeMetadata(header: Record<string, unknown>): string | null {
  // SD-JWT VC §6.3.5: Type Metadata documents travel in the JWT header
  // `vctm` claim as an array of base64url-encoded JSON documents.
  const vctm = header['vctm'];
  if (!Array.isArray(vctm) || vctm.length === 0) return null;
  const first = vctm[0];
  if (typeof first !== 'string') return null;
  try {
    const json = JSON.parse(new TextDecoder().decode(base64UrlToBytes(first)));
    return JSON.stringify(json, null, 2);
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked encode to avoid stack overflow on largeish files. mdocs are
  // typically ~5 KB so a single pass would also work; this is defensive.
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function bytesToPem(bytes: Uint8Array): string {
  const b64 = bytesToBase64(bytes);
  const lines = b64.match(/.{1,64}/g)?.join('\n') ?? b64;
  return `-----BEGIN CERTIFICATE-----\n${lines}\n-----END CERTIFICATE-----`;
}

/** Concatenate every cert in an mdoc x5chain into a PEM bundle. */
function mdocChainToPem(chain: Uint8Array[] | undefined): string | null {
  if (!chain || chain.length === 0) return null;
  return chain.map(bytesToPem).join('\n');
}

/** Pull the status URI from an mdoc MSO, accepting both ETSI flat and IETF nested envelopes. */
function extractMdocStatusUri(parsed: ParsedMdoc): string | null {
  const status = parsed.issuerAuth.mso.status;
  if (!status || typeof status !== 'object' || Array.isArray(status)) return null;
  const obj = status as Record<string, unknown>;
  if (typeof obj.uri === 'string' && obj.uri.length > 0) return obj.uri;
  const nested = obj.status_list;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const uri = (nested as Record<string, unknown>).uri;
    if (typeof uri === 'string' && uri.length > 0) return uri;
  }
  return null;
}

/** Heuristic: should this file be read as binary (CBOR) and base64-encoded? */
function looksLikeBinaryCbor(filename: string): boolean {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.cbor.base64') || lower.endsWith('.b64')) return false;
  return lower.endsWith('.cbor');
}

/**
 * Read a dropped or selected file into a string suitable for the
 * eaaPayload form field. Binary CBOR (.cbor) is base64-encoded so the
 * downstream parser dispatch can sniff it; other extensions (text-shaped
 * SD-JWT VC compact, base64 or hex CBOR) come through verbatim.
 */
async function readFileAsPayloadString(file: File): Promise<string> {
  if (looksLikeBinaryCbor(file.name)) {
    const buf = await file.arrayBuffer();
    return bytesToBase64(new Uint8Array(buf));
  }
  return file.text();
}

const EvidenceSchema = z.object({
  eaaPayload: z
    .string()
    .min(1, { message: 'EAA payload is required.' })
    .refine(isValidEvidenceInput, {
      message:
        'Does not look like an SD-JWT VC compact serialisation or an mdoc CBOR (hex or base64-encoded).',
    }),
  issuerCert: z.string().optional(),
  statusListUrl: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^https?:\/\/.+/i.test(v),
      { message: 'Must be a valid http(s) URL.' },
    ),
  typeMetadata: z
    .string()
    .optional()
    .refine(isJsonOrEmpty, { message: 'Must be valid JSON.' }),
});

type EvidenceForm = z.infer<typeof EvidenceSchema>;

export default function UploadPage() {
  return (
    <Suspense fallback={<UploadFallback />}>
      <UploadInner />
    </Suspense>
  );
}

function UploadFallback() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-zinc-500">Loading…</p>
    </article>
  );
}

function UploadInner() {
  const router = useRouter();
  const params = useSearchParams();

  const scope = parseScope(params);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EvidenceForm>({
    resolver: zodResolver(EvidenceSchema),
  });

  const payloadValue = watch('eaaPayload') ?? '';
  const hasPayload = payloadValue.trim().length > 0;

  // Pre-fill from a reference sample when ?sample=<id> is supplied. Only
  // runs once on mount so manual edits are not stomped on subsequent
  // re-renders. Profile-aware: SD-JWT VC samples carry the compact
  // serialisation; mdoc samples carry base64-encoded CBOR.
  const samplePrefilled = useRef(false);
  useEffect(() => {
    if (samplePrefilled.current) return;
    const sampleId = params.get('sample');
    if (!sampleId) return;
    const sample = getSampleByIdSync(sampleId);
    if (!sample) return;
    const payload =
      sample.profile === 'sd-jwt-vc'
        ? sample.compact_serialisation
        : sample.cbor_base64;
    setValue('eaaPayload', payload, { shouldValidate: true });
    setValue('issuerCert', sample.issuer_cert_pem, { shouldValidate: false });
    samplePrefilled.current = true;
  }, [params, setValue]);

  // Pre-fill from a previous assessment when ?fromReport=<id> is supplied.
  // The evidence is read from sessionStorage where the upload page wrote
  // it on the previous run; missing entries (different tab / browser
  // closed) leave the form empty and the user pastes manually.
  const fromReportPrefilled = useRef(false);
  useEffect(() => {
    if (fromReportPrefilled.current) return;
    const reportId = params.get('fromReport');
    if (!reportId) return;
    try {
      const saved = sessionStorage.getItem(`iwc:evidence:${reportId}`);
      if (!saved) return;
      const data = JSON.parse(saved) as {
        eaaPayload?: string;
        issuerCert?: string;
        statusListUrl?: string;
        typeMetadata?: string;
      };
      if (data.eaaPayload)
        setValue('eaaPayload', data.eaaPayload, { shouldValidate: true });
      if (data.issuerCert)
        setValue('issuerCert', data.issuerCert, { shouldValidate: false });
      if (data.statusListUrl)
        setValue('statusListUrl', data.statusListUrl, { shouldValidate: false });
      if (data.typeMetadata)
        setValue('typeMetadata', data.typeMetadata, { shouldValidate: false });
      fromReportPrefilled.current = true;
    } catch {
      // sessionStorage unavailable or malformed JSON; leave form empty.
    }
  }, [params, setValue]);

  // Auto-extract issuer X.509, status list URL and type metadata from the
  // pasted token whenever they're present. Each field is only filled when
  // it's empty or still holds the value the auto-filler last wrote, so
  // anything the user has manually typed (or that was prefilled from a
  // sample / previous report) is left alone.
  const autoFilled = useRef<{
    issuerCert?: string;
    statusListUrl?: string;
    typeMetadata?: string;
  }>({});
  const [mdocContext, setMdocContext] = useState<
    { docType: string; namespaces: string[] } | null
  >(null);
  const [detectedKind, setDetectedKind] = useState<ParsedEvidence['kind'] | null>(null);
  useEffect(() => {
    const trimmed = payloadValue.trim();
    if (!trimmed) {
      setMdocContext(null);
      setDetectedKind(null);
      return;
    }
    const parsed = tryParseEvidence(trimmed);
    if (!parsed) {
      setDetectedKind(null);
      return;
    }
    setDetectedKind(parsed.kind);
    const setIfAuto = (
      field: 'issuerCert' | 'statusListUrl' | 'typeMetadata',
      next: string | null,
    ) => {
      if (!next) return;
      const current = (getValues(field) ?? '').trim();
      const lastAuto = autoFilled.current[field];
      if (current === '' || current === lastAuto) {
        setValue(field, next, { shouldValidate: true });
        autoFilled.current[field] = next;
      }
    };
    if (parsed.kind === 'sd-jwt-vc') {
      setMdocContext(null);
      const sd: ParsedSdJwtVc = parsed.parsed;
      const x5c = sd.header['x5c'];
      if (Array.isArray(x5c) && typeof x5c[0] === 'string' && x5c[0].length > 0) {
        setIfAuto('issuerCert', derBase64ToPem(x5c[0]));
      }
      setIfAuto('statusListUrl', extractStatusUri(sd.payload));
      setIfAuto('typeMetadata', extractTypeMetadata(sd.header));
    } else {
      const m: ParsedMdoc = parsed.parsed;
      setMdocContext({
        docType: m.docType,
        namespaces: Object.keys(m.nameSpaces),
      });
      setIfAuto('issuerCert', mdocChainToPem(m.issuerAuth.protectedHeader.x5chain));
      setIfAuto('statusListUrl', extractMdocStatusUri(m));
      // Type metadata isn't a concept in mdoc; leave the field alone.
    }
  }, [payloadValue, getValues, setValue]);

  if (!scope) {
    return (
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          The assessment scope is missing or invalid.{' '}
          <Link
            href="/eudi-wallet-compliance/self-assessment/"
            className="font-medium text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
          >
            Pick a scope to continue.
          </Link>
        </p>
      </article>
    );
  }

  const onSubmit = async (data: EvidenceForm) => {
    setSubmitError(null);
    const evidence: Evidence = {
      eaaPayload: data.eaaPayload.trim(),
      ...(data.issuerCert?.trim() ? { issuerCert: data.issuerCert.trim() } : {}),
      ...(data.statusListUrl?.trim()
        ? { statusListUrl: data.statusListUrl.trim() }
        : {}),
      ...(data.typeMetadata?.trim()
        ? { typeMetadata: JSON.parse(data.typeMetadata) }
        : {}),
    };
    try {
      const { reportId } = await runAssessmentAction(scope, evidence);
      // Persist the submitted evidence to sessionStorage keyed by report
      // id. The Re-test link on each verdict on the report page reads
      // this back through ?fromReport=<id> so the user can iterate on
      // the same EAA without pasting it again. sessionStorage stays
      // local to the browser tab and clears on close, matching the
      // same privacy posture as the report itself.
      try {
        sessionStorage.setItem(
          `iwc:evidence:${reportId}`,
          JSON.stringify({
            eaaPayload: data.eaaPayload,
            issuerCert: data.issuerCert ?? '',
            statusListUrl: data.statusListUrl ?? '',
            typeMetadata: data.typeMetadata ?? '',
          }),
        );
      } catch {
        // Storage may be unavailable or quota-exceeded; the report
        // still runs, the re-test link will just land on an empty form.
      }
      const reportParams = new URLSearchParams({ id: reportId });
      // Forward an optional ?focus=<control_id> through to the report so
      // the user lands on a single-control filter when they came here
      // from the per-control CTA on a control detail page.
      const focus = params.get('focus');
      if (focus) reportParams.set('focus', focus);
      router.push(
        `/eudi-wallet-compliance/self-assessment/report/?${reportParams.toString()}`,
      );
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  };

  // When the user arrives via the per-control "Run an assessment" CTA on
  // a control detail page, the scope is fully pre-selected and step 1 is
  // effectively skipped. Rephrase the kicker so the page doesn't claim
  // to be "Step 2 of 2" of a flow the user never touched the first step
  // of.
  const focusedControl = params.get('focus');
  const arrivedFromControl = Boolean(focusedControl);

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        {arrivedFromControl
          ? `Self-Assessment · Testing ${focusedControl}`
          : 'Self-Assessment · Step 2 of 2'}
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        Upload your evidence
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        {arrivedFromControl
          ? `Paste your EAA below to see how it scores against ${focusedControl} and the rest of the controls in this scope. Everything stays in your browser; nothing is sent to a server.`
          : 'Paste your EAA artefacts below. Everything stays in your browser; nothing is sent to a server.'}
      </p>

      <ScopeSummary scope={scope} />

      <ProfileMismatchWarning
        scope={scope}
        detectedKind={detectedKind}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
        <FieldGroup
          label="EAA payload"
          affordance="Drop a file or paste below"
          hint={
            scope.profile.includes('mdoc') && !scope.profile.includes('sd-jwt-vc')
              ? 'mdoc/mDL CBOR. Accepts a binary .cbor file or hex / base64 text.'
              : scope.profile.includes('sd-jwt-vc') && !scope.profile.includes('mdoc')
                ? 'SD-JWT VC compact serialisation: header.payload.signature with optional ~disclosures.'
                : 'SD-JWT VC compact serialisation or mdoc CBOR (binary .cbor, or hex / base64). Format is auto-detected.'
          }
          error={errors.eaaPayload?.message}
        >
          <DragDropTextarea
            name="eaaPayload"
            rows={6}
            register={register}
            setValue={setValue}
            value={payloadValue}
            highlight="jwt"
            placeholder="eyJhbGciOiJFUzI1NiIsImtpZCI6Imlzc3Vlci1rZXktMSIsInR5cCI6InZjK3NkLWp3dCIsIng1YyI6WyIuLi4iXX0..."
          />
          <FileLoader name="eaaPayload" setValue={setValue} />
        </FieldGroup>

        {detectedKind === 'mdoc' && mdocContext && (
          <MdocContextBadges
            docType={mdocContext.docType}
            namespaces={mdocContext.namespaces}
          />
        )}

        <FieldGroup
          label="Issuer X.509 certificate"
          affordance="Drop a file or paste below"
          hint="Optional. PEM format."
          error={errors.issuerCert?.message}
        >
          <DragDropTextarea
            name="issuerCert"
            rows={5}
            register={register}
            setValue={setValue}
            placeholder="-----BEGIN CERTIFICATE-----..."
          />
          <FileLoader name="issuerCert" setValue={setValue} />
        </FieldGroup>

        <FieldGroup
          label="Status list URL"
          hint="Optional. Used by the runtime resolver to fetch the credential's status."
          error={errors.statusListUrl?.message}
        >
          <input
            type="url"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-300 focus:outline-2 focus:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            placeholder="https://issuer.example/status/list-1"
            {...register('statusListUrl')}
          />
        </FieldGroup>

        {detectedKind !== 'mdoc' && (
          <FieldGroup
            label="Type metadata"
            hint="Optional. JSON object that maps to the vct. (SD-JWT VC only; mdoc surfaces its docType and namespaces above instead.)"
            error={errors.typeMetadata?.message}
          >
            <textarea
              rows={4}
              spellCheck={false}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-blue-300 focus:outline-2 focus:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder='{"vct": "...", ...}'
              {...register('typeMetadata')}
            />
          </FieldGroup>
        )}

        {submitError && (
          <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400">
            {submitError}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <Link
            href="/eudi-wallet-compliance/self-assessment/"
            className="text-sm font-medium text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
          >
            Back to scope
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !hasPayload}
            title={
              !hasPayload ? 'Paste or drop an EAA payload to run the assessment.' : undefined
            }
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-zinc-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? 'Running assessment…' : 'Run Assessment'}
          </button>
        </div>
      </form>
    </article>
  );
}

function parseScope(params: URLSearchParams): AssessmentScope | null {
  const moduleId = params.get('module');
  const tier = params.get('tier');
  const role = params.getAll('role');
  const profile = params.getAll('profile');
  if (moduleId !== 'eaa-conformance') return null;
  if (tier !== 'ordinary' && tier !== 'qeaa' && tier !== 'pub-eaa') return null;
  const validRoles = role.filter((r): r is 'issuer' | 'verifier' =>
    r === 'issuer' || r === 'verifier',
  );
  const validProfiles = profile.filter((p): p is 'sd-jwt-vc' | 'mdoc' =>
    p === 'sd-jwt-vc' || p === 'mdoc',
  );
  if (validRoles.length === 0 || validProfiles.length === 0) return null;
  return {
    module: moduleId,
    profile: validProfiles,
    role: validRoles,
    tier,
  };
}

function ScopeSummary({ scope }: { scope: AssessmentScope }) {
  return (
    <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        Assessment scope
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-zinc-700 dark:text-zinc-300">
        <dt className="font-medium">Module</dt>
        <dd>EAA Conformance</dd>
        <dt className="font-medium">Profile</dt>
        <dd>{scope.profile.map((p) => PROFILE_LABEL[p]).join(', ')}</dd>
        <dt className="font-medium">Role</dt>
        <dd>{scope.role.map((r) => ROLE_LABEL[r]).join(', ')}</dd>
        <dt className="font-medium">Tier</dt>
        <dd>{TIER_LABEL[scope.tier]}</dd>
      </dl>
    </div>
  );
}

/**
 * Soft warning displayed above the form when the auto-detected payload
 * profile disagrees with what the user picked in the scope step. The
 * detected format wins for parsing and dispatch; the warning only
 * surfaces the discrepancy so the user knows to fix one or the other.
 */
function ProfileMismatchWarning({
  scope,
  detectedKind,
}: {
  scope: AssessmentScope;
  detectedKind: ParsedEvidence['kind'] | null;
}) {
  if (!detectedKind) return null;
  if (scope.profile.includes(detectedKind)) return null;
  const detectedLabel = PROFILE_LABEL[detectedKind] ?? detectedKind;
  const scopeLabel = scope.profile.map((p) => PROFILE_LABEL[p] ?? p).join(', ');
  return (
    <div
      role="status"
      data-testid="profile-mismatch-warning"
      className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
    >
      The pasted payload looks like <strong>{detectedLabel}</strong>, but the
      scope you picked is <strong>{scopeLabel}</strong>. The assessment will
      run against the detected format; go back to the scope step if you meant
      something different.
    </div>
  );
}

/**
 * Read-only summary of the mdoc credential's docType and namespace list.
 * Surfaced in lieu of the SD-JWT VC type-metadata textarea, which has no
 * mdoc analogue.
 */
function MdocContextBadges({
  docType,
  namespaces,
}: {
  docType: string;
  namespaces: string[];
}) {
  return (
    <div data-testid="mdoc-context-badges">
      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
        mdoc context
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
        Auto-extracted from the parsed credential. Type-metadata content
        is not a concept in mdoc; the docType and namespace list serve
        the equivalent role.
      </p>
      <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[max-content_1fr] sm:gap-x-6 sm:gap-y-2">
        <dt className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          docType
        </dt>
        <dd>
          <code
            data-testid="mdoc-doctype"
            className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {docType}
          </code>
        </dd>
        <dt className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Namespaces
        </dt>
        <dd className="flex flex-wrap gap-1">
          {namespaces.map((ns) => (
            <code
              key={ns}
              data-testid="mdoc-namespace"
              className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {ns}
            </code>
          ))}
        </dd>
      </dl>
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  affordance,
  error,
  children,
}: {
  label: string;
  hint?: string;
  /**
   * Short call-to-action rendered as a tinted pill next to the label.
   * Used on file-droppable fields to make the drop-or-paste affordance
   * unmistakable at a glance.
   */
  affordance?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-zinc-950 dark:text-white">
          {label}
        </label>
        {affordance && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {affordance}
          </span>
        )}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
      )}
      <div className="mt-2 space-y-2">{children}</div>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

interface FileLoaderProps {
  name: 'eaaPayload' | 'issuerCert';
  setValue: ReturnType<typeof useForm<EvidenceForm>>['setValue'];
}

function FileLoader({ name, setValue }: FileLoaderProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-600 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300">
      <input
        type="file"
        className="sr-only"
        accept={
          name === 'eaaPayload'
            ? '.cbor,.cbor.base64,.b64,.txt,.json,application/cbor'
            : '.pem,.crt,.cer,.txt,application/x-pem-file'
        }
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const value =
            name === 'eaaPayload'
              ? await readFileAsPayloadString(file)
              : await file.text();
          setValue(name, value, { shouldValidate: true });
        }}
      />
      Or load from file…
    </label>
  );
}

interface DragDropTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: 'eaaPayload' | 'issuerCert';
  register: ReturnType<typeof useForm<EvidenceForm>>['register'];
  setValue: ReturnType<typeof useForm<EvidenceForm>>['setValue'];
  /** Live form value, used to drive the highlight overlay. Optional. */
  value?: string;
  /** Set to 'jwt' to colour-code three-segment compact JWTs and SD-JWT VCs. */
  highlight?: 'jwt';
}

function DragDropTextarea({
  name,
  register,
  setValue,
  value,
  highlight,
  onScroll: callerOnScroll,
  ...textareaProps
}: DragDropTextareaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const overlayRef = useRef<HTMLPreElement | null>(null);
  const showHighlight = highlight === 'jwt' && !!value && looksLikeJwt(value);

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = e.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    callerOnScroll?.(e);
  };

  // The highlight overlay and the textarea must share padding, font, size,
  // line height and wrapping behaviour so the coloured spans line up
  // exactly under the user's cursor.
  const sharedTextClasses =
    'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-xs leading-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950';

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        const value =
          name === 'eaaPayload'
            ? await readFileAsPayloadString(file)
            : await file.text();
        setValue(name, value, { shouldValidate: true });
      }}
      className={`relative rounded-md transition ${
        isDragOver ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950' : ''
      }`}
    >
      {showHighlight && (
        <pre
          ref={overlayRef}
          aria-hidden="true"
          className={`${sharedTextClasses} pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap text-zinc-900 dark:text-zinc-100`}
          style={{ overflowWrap: 'anywhere', wordBreak: 'break-all' }}
        >
          <HighlightedJwt value={value!} />
        </pre>
      )}
      <textarea
        spellCheck={false}
        className={`${sharedTextClasses} relative z-10 overflow-auto ${
          showHighlight
            ? 'text-transparent caret-zinc-900 dark:caret-zinc-100 selection:bg-blue-500/40'
            : 'text-zinc-900 dark:text-zinc-100'
        } focus:border-blue-300 focus:outline-2 focus:outline-blue-600`}
        style={{ overflowWrap: 'anywhere', wordBreak: 'break-all', backgroundColor: showHighlight ? 'transparent' : undefined }}
        onScroll={syncScroll}
        {...textareaProps}
        {...register(name)}
      />
      {isDragOver && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-md bg-blue-50/85 text-sm font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
        >
          Drop file to load
        </div>
      )}
    </div>
  );
}

// Colour palette mirrors the iGrant.io devtools JWT decoder so the look
// is consistent across iGrant.io properties.
const JWT_COLOUR_HEADER = '#fb015b';
const JWT_COLOUR_PAYLOAD = '#d63aff';
const JWT_COLOUR_SIGNATURE = '#00b9f1';
const JWT_COLOUR_DISCLOSURE = '#047857';
const JWT_COLOUR_KBJWT = '#b45309';
const JWT_COLOUR_SEPARATOR = '#a1a1aa';

function looksLikeJwt(s: string): boolean {
  // First chunk before any '~' must look like header.payload.signature.
  const first = s.split('~')[0] ?? '';
  const parts = first.split('.');
  if (parts.length !== 3) return false;
  return parts.every((p) => /^[A-Za-z0-9_-]*$/.test(p));
}

function HighlightedJwt({ value }: { value: string }): React.ReactElement {
  // SD-JWT VC compact form is `header.payload.signature[~disclosure]*[~kbjwt]`.
  // Each `~` separates a base64url segment; the final segment after the last
  // `~` is the optional Key Binding JWT (which itself has dots inside it).
  const tildeChunks = value.split('~');
  const jws = tildeChunks[0] ?? '';
  const tail = tildeChunks.slice(1);
  const dotChunks = jws.split('.');
  const nodes: React.ReactElement[] = [];
  const dotColours = [JWT_COLOUR_HEADER, JWT_COLOUR_PAYLOAD, JWT_COLOUR_SIGNATURE];

  dotChunks.forEach((chunk, i) => {
    if (i > 0) {
      nodes.push(
        <span key={`d-sep-${i}`} style={{ color: JWT_COLOUR_SEPARATOR }}>
          .
        </span>,
      );
    }
    nodes.push(
      <span key={`d-${i}`} style={{ color: dotColours[i] ?? JWT_COLOUR_SIGNATURE }}>
        {chunk}
      </span>,
    );
  });

  tail.forEach((chunk, i) => {
    nodes.push(
      <span key={`t-sep-${i}`} style={{ color: JWT_COLOUR_SEPARATOR }}>
        ~
      </span>,
    );
    // The last segment may be a KB-JWT (it contains its own dots). Earlier
    // segments are disclosures.
    const isLast = i === tail.length - 1;
    const isKbJwt = isLast && chunk.includes('.') && chunk.length > 0;
    nodes.push(
      <span
        key={`t-${i}`}
        style={{ color: isKbJwt ? JWT_COLOUR_KBJWT : JWT_COLOUR_DISCLOSURE }}
      >
        {chunk}
      </span>,
    );
  });

  return <>{nodes}</>;
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
