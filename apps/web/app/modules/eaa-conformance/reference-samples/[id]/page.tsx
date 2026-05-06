import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getSampleByIdSync,
  loadAllSamplesSync,
  loadAllControlsSync,
} from '@iwc/controls/sync';
import { controlIdToSlug } from '@iwc/shared';
import { CopyButton } from './_CopyButton';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return loadAllSamplesSync().map((s) => ({ id: s.sample_id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sample = getSampleByIdSync(id);
  if (!sample) return {};
  const url = `/modules/eaa-conformance/reference-samples/${sample.sample_id}/`;
  return {
    title: `${sample.sample_id.toUpperCase()} · Reference Samples · iGrant.io`,
    description: sample.description,
    alternates: { canonical: url },
  };
}

const PROFILE_LABEL: Record<string, string> = {
  'sd-jwt-vc': 'SD-JWT VC',
  mdoc: 'ISO mdoc',
};

const TIER_LABEL: Record<string, string> = {
  'ordinary-eaa': 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
};

const TIER_TO_SCOPE: Record<string, string> = {
  'ordinary-eaa': 'ordinary',
  qeaa: 'qeaa',
  'pub-eaa': 'pub-eaa',
};

export default async function SampleDetail({ params }: PageProps) {
  const { id } = await params;
  const sample = getSampleByIdSync(id);
  if (!sample) notFound();

  const moduleByControlId = new Map<string, string>();
  for (const c of loadAllControlsSync()) moduleByControlId.set(c.id, c.module);

  const pemDataUrl = `data:application/x-pem-file;base64,${Buffer.from(
    sample.issuer_cert_pem,
    'utf8',
  ).toString('base64')}`;
  const jsonDataUrl = `data:application/json;base64,${Buffer.from(
    JSON.stringify(sample, null, 2),
    'utf8',
  ).toString('base64')}`;

  // Profile-specific payload download. SD-JWT VC carries a textual
  // compact serialisation (rendered as application/jwt); mdoc carries
  // raw CBOR bytes (we surface the already-base64 form as a data URL
  // wrapping application/cbor so the downloaded .cbor file is binary).
  const payloadDownload =
    sample.profile === 'sd-jwt-vc'
      ? {
          href: `data:application/jwt;base64,${Buffer.from(
            sample.compact_serialisation,
            'utf8',
          ).toString('base64')}`,
          filename: `${sample.sample_id}.jwt`,
          label: 'Download .jwt',
        }
      : {
          href: `data:application/cbor;base64,${sample.cbor_base64}`,
          filename: `${sample.sample_id}.cbor`,
          label: 'Download .cbor',
        };

  const runScopeParams = new URLSearchParams({
    module: 'eaa-conformance',
    role: 'issuer',
    profile: sample.profile,
    tier: TIER_TO_SCOPE[sample.tier] ?? 'ordinary',
    sample: sample.sample_id,
  });
  const runHref = `/eudi-wallet-compliance/self-assessment/upload/?${runScopeParams.toString()}`;

  return (
    <article className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Reference Sample
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        {sample.title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        {sample.description}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-blue-100 px-2 py-1 font-mono font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          {sample.sample_id.toUpperCase()}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {PROFILE_LABEL[sample.profile] ?? sample.profile}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {TIER_LABEL[sample.tier] ?? sample.tier}
        </span>
        <span className="text-zinc-500">
          Generated {new Date(sample.generated_at).toLocaleDateString('en-GB')}
        </span>
      </div>

      <section className="mt-8 flex flex-wrap gap-3">
        <Link
          href={runHref}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Run Self-Assessment with this sample
        </Link>
        <a
          href={payloadDownload.href}
          download={payloadDownload.filename}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:border-blue-300 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-blue-700 dark:hover:text-blue-300"
        >
          {payloadDownload.label}
        </a>
        <a
          href={pemDataUrl}
          download={`${sample.sample_id}-issuer.pem`}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:border-blue-300 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-blue-700 dark:hover:text-blue-300"
        >
          Download .pem
        </a>
        <a
          href={jsonDataUrl}
          download={`${sample.sample_id}.json`}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:border-blue-300 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-blue-700 dark:hover:text-blue-300"
        >
          Download .json
        </a>
      </section>

      {sample.profile === 'sd-jwt-vc' ? (
        <>
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                Compact serialisation
              </h2>
              <CopyButton
                text={sample.compact_serialisation}
                label="Copy compact form"
              />
            </div>
            <pre className="mt-3 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
              {sample.compact_serialisation}
            </pre>
          </section>

          <details className="mt-8 rounded-md border border-zinc-200 bg-white open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/40">
            <summary className="cursor-pointer p-4 text-sm font-semibold text-zinc-950 dark:text-white">
              Decoded header
            </summary>
            <pre className="overflow-x-auto border-t border-zinc-200 p-4 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
              {JSON.stringify(sample.decoded_header, null, 2)}
            </pre>
          </details>

          <details className="mt-3 rounded-md border border-zinc-200 bg-white open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/40">
            <summary className="cursor-pointer p-4 text-sm font-semibold text-zinc-950 dark:text-white">
              Decoded payload
            </summary>
            <pre className="overflow-x-auto border-t border-zinc-200 p-4 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
              {JSON.stringify(sample.decoded_payload, null, 2)}
            </pre>
          </details>
        </>
      ) : (
        <>
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                CBOR (base64)
              </h2>
              <CopyButton text={sample.cbor_base64} label="Copy base64 CBOR" />
            </div>
            <pre className="mt-3 max-h-72 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-5 break-all text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
              {sample.cbor_base64}
            </pre>
          </section>

          <section className="mt-8 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              docType
            </h3>
            <code className="mt-1 inline-block rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              {String(sample.decoded_mso.docType ?? '(none)')}
            </code>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
              Namespaces
            </h3>
            <div className="mt-1 flex flex-wrap gap-1">
              {Object.keys(sample.decoded_namespaces).map((ns) => (
                <code
                  key={ns}
                  className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {ns}
                </code>
              ))}
            </div>
          </section>

          <details className="mt-8 rounded-md border border-zinc-200 bg-white open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/40">
            <summary className="cursor-pointer p-4 text-sm font-semibold text-zinc-950 dark:text-white">
              Decoded protected header
            </summary>
            <pre className="overflow-x-auto border-t border-zinc-200 p-4 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
              {JSON.stringify(sample.decoded_protected_header, null, 2)}
            </pre>
          </details>

          <details className="mt-3 rounded-md border border-zinc-200 bg-white open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/40">
            <summary className="cursor-pointer p-4 text-sm font-semibold text-zinc-950 dark:text-white">
              Decoded MobileSecurityObject
            </summary>
            <pre className="overflow-x-auto border-t border-zinc-200 p-4 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
              {JSON.stringify(sample.decoded_mso, null, 2)}
            </pre>
          </details>

          <details className="mt-3 rounded-md border border-zinc-200 bg-white open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/40">
            <summary className="cursor-pointer p-4 text-sm font-semibold text-zinc-950 dark:text-white">
              Decoded namespaces
            </summary>
            <pre className="overflow-x-auto border-t border-zinc-200 p-4 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
              {JSON.stringify(sample.decoded_namespaces, null, 2)}
            </pre>
          </details>
        </>
      )}

      <details className="mt-3 rounded-md border border-zinc-200 bg-white open:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:open:bg-zinc-900/40">
        <summary className="cursor-pointer p-4 text-sm font-semibold text-zinc-950 dark:text-white">
          Issuer certificate (PEM)
        </summary>
        <pre className="overflow-x-auto border-t border-zinc-200 p-4 font-mono text-xs leading-5 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
          {sample.issuer_cert_pem}
        </pre>
      </details>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Exercises {sample.exercises_controls.length} control
          {sample.exercises_controls.length === 1 ? '' : 's'}
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {sample.exercises_controls.map((cid) => {
            const moduleId = moduleByControlId.get(cid);
            const slug = controlIdToSlug(cid);
            const href = moduleId
              ? `/modules/${moduleId}/controls/${slug}/`
              : null;
            return (
              <li key={cid} className="font-mono text-xs">
                {href ? (
                  <Link
                    href={href}
                    className="text-blue-700 underline-offset-4 hover:underline dark:text-blue-400"
                  >
                    {cid}
                  </Link>
                ) : (
                  <span className="text-zinc-700 dark:text-zinc-300">{cid}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p>
          <Link
            href="/modules/eaa-conformance/reference-samples/"
            className="text-sm font-semibold text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
          >
            Back to all samples
          </Link>
        </p>
      </section>
    </article>
  );
}
