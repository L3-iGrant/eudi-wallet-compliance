'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import type { AssessmentScope, Evidence } from '@iwc/engine';
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

function isValidSdJwtVc(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return false;
  // Compact form: header.payload.signature[~disclosure...][~kbjwt]
  const segments = trimmed.split('~');
  const jws = segments[0]?.split('.');
  if (!jws || jws.length !== 3) return false;
  return jws.every((seg) => /^[A-Za-z0-9_-]*$/.test(seg));
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

const EvidenceSchema = z.object({
  eaaPayload: z
    .string()
    .min(1, { message: 'EAA payload is required.' })
    .refine(isValidSdJwtVc, {
      message:
        'Does not look like an SD-JWT VC compact serialisation (three base64url segments separated by dots, optionally with ~disclosures).',
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
    formState: { errors, isSubmitting },
  } = useForm<EvidenceForm>({
    resolver: zodResolver(EvidenceSchema),
  });

  const payloadValue = watch('eaaPayload') ?? '';
  const hasPayload = payloadValue.trim().length > 0;

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
      router.push(
        `/eudi-wallet-compliance/self-assessment/report/?id=${encodeURIComponent(reportId)}`,
      );
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Self-Assessment · Step 2 of 2
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        Upload your evidence
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        Paste your EAA artefacts below. Everything stays in your browser; nothing is sent to a server.
      </p>

      <ScopeSummary scope={scope} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
        <FieldGroup
          label="EAA payload"
          hint="SD-JWT VC compact serialisation: header.payload.signature with optional ~disclosures. Drop a file or paste below."
          error={errors.eaaPayload?.message}
        >
          <DragDropTextarea
            name="eaaPayload"
            rows={6}
            register={register}
            setValue={setValue}
            placeholder="eyJhbGciOiJFUzI1NiIsImtpZCI6Imlzc3Vlci1rZXktMSIsInR5cCI6InZjK3NkLWp3dCIsIng1YyI6WyIuLi4iXX0..."
          />
          <FileLoader name="eaaPayload" setValue={setValue} />
        </FieldGroup>

        <FieldGroup
          label="Issuer X.509 certificate"
          hint="Optional. PEM format. Drop a file or paste below."
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

        <FieldGroup
          label="Type metadata"
          hint="Optional. JSON object that maps to the vct."
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

function FieldGroup({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-zinc-950 dark:text-white">{label}</label>
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
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          setValue(name, text, { shouldValidate: true });
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
}

function DragDropTextarea({
  name,
  register,
  setValue,
  ...textareaProps
}: DragDropTextareaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
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
        const text = await file.text();
        setValue(name, text, { shouldValidate: true });
      }}
      className={`relative rounded-md transition ${
        isDragOver ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950' : ''
      }`}
    >
      <textarea
        spellCheck={false}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 shadow-sm focus:border-blue-300 focus:outline-2 focus:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        {...textareaProps}
        {...register(name)}
      />
      {isDragOver && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-blue-50/85 text-sm font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
        >
          Drop file to load
        </div>
      )}
    </div>
  );
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
