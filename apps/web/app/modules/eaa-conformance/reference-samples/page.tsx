import type { Metadata } from 'next';
import Link from 'next/link';
import { loadAllSamplesSync } from '@iwc/controls/sync';
import { ChevronRight } from '../../../_components/ChevronRight';

export const metadata: Metadata = {
  title: 'Reference Samples · EUDI Wallet Compliance · iGrant.io',
  description:
    'Cryptographically-valid SD-JWT VC reference samples mirroring the ETSI EAA Plugtests test cases. Use them to exercise the self-assessment runner or any conformance pipeline.',
  alternates: { canonical: '/modules/eaa-conformance/reference-samples/' },
};

const PROFILE_LABEL: Record<string, string> = {
  'sd-jwt-vc': 'SD-JWT VC',
  mdoc: 'ISO mdoc',
  abstract: 'Abstract',
};

const TIER_LABEL: Record<string, string> = {
  'ordinary-eaa': 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
};

export default function ReferenceSamplesIndex() {
  const samples = loadAllSamplesSync();
  return (
    <article className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Reference Samples
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        Cryptographically-valid SD-JWT VC EAAs
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        Each sample mirrors an ETSI EAA Plugtests SJV-EAA test case. Signed
        with a self-signed iGrant.io reference issuer certificate; ready to
        drop into the Self-Assessment runner or any conformance pipeline.
      </p>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {samples.map((s) => (
          <Link
            key={s.sample_id}
            href={`/modules/eaa-conformance/reference-samples/${s.sample_id}/`}
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-700"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                {s.sample_id.toUpperCase()}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {PROFILE_LABEL[s.profile] ?? s.profile}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {TIER_LABEL[s.tier] ?? s.tier}
              </span>
            </div>
            <h2 className="mt-3 text-base font-semibold text-zinc-950 group-hover:underline dark:text-white">
              {s.title}
            </h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {s.description}
            </p>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
              Exercises {s.exercises_controls.length} control
              {s.exercises_controls.length === 1 ? '' : 's'}
            </p>
            <span className="mt-3 inline-flex items-center text-sm font-semibold text-blue-700 group-hover:underline dark:text-blue-400">
              Open
              <ChevronRight className="ml-1" />
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p>
          <Link
            href="/modules/eaa-conformance/"
            className="text-sm font-semibold text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
          >
            Back to EAA Conformance
          </Link>
        </p>
      </section>
    </article>
  );
}
