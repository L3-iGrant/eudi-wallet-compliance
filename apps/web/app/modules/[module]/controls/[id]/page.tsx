import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadAllControls, type Control } from '@iwc/controls';
import { controlIdToSlug, slugToControlId } from '@iwc/shared';
import { requirementLevelTooltip } from '../../../../../lib/requirement-level';
import { HoverTooltip } from '../../../../_components/HoverTooltip';

interface PageProps {
  params: Promise<{ module: string; id: string }>;
}

const REVIEW_DATE = '2026-05-01';

function firstSentence(text: string, maxLen = 160): string {
  const trimmed = text.trim();
  const sentenceMatch = trimmed.match(/^([^.!?]+[.!?])(\s|$)/);
  const candidate = sentenceMatch?.[1] ?? trimmed;
  if (candidate.length <= maxLen) return candidate;
  return candidate.slice(0, maxLen - 1).trimEnd() + '…';
}

function ucfirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const APPLIES_TO_LABEL: Record<string, string> = {
  'ordinary-eaa': 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
  all: 'All EAA tiers',
};

const PROFILE_LABEL: Record<string, string> = {
  'sd-jwt-vc': 'SD-JWT VC',
  mdoc: 'mdoc',
  abstract: 'Abstract',
};

const ROLE_LABEL: Record<string, string> = {
  issuer: 'Issuer',
  verifier: 'Verifier',
  wallet: 'Wallet',
  rp: 'Relying Party',
  qtsp: 'QTSP',
  all: 'All roles',
};

const EVIDENCE_LABEL: Record<string, { name: string; description: string }> = {
  'eaa-payload': {
    name: 'EAA payload',
    description: 'The decoded JSON payload of the SD-JWT VC EAA.',
  },
  'eaa-header': {
    name: 'EAA header',
    description: 'The protected JOSE header of the EAA signature.',
  },
  'issuer-cert': {
    name: 'Issuer certificate',
    description: 'The X.509 certificate that supports the EAA signature.',
  },
  'status-list': {
    name: 'Status list',
    description: 'The IETF Token Status List or equivalent dereferenced from the EAA status URI.',
  },
  'type-metadata': {
    name: 'Type metadata',
    description: 'The SD-JWT VC Type Metadata document referenced by vct and vct#integrity.',
  },
  'trust-list': {
    name: 'Trust list',
    description: 'The ETSI trust list publication that lists the issuer.',
  },
};

const MODULE_LABEL: Record<string, string> = {
  'eaa-conformance': 'EAA Conformance',
  'pid-lpid': 'PID and LPID',
  'wallet-attestation': 'Wallet Attestation',
  oid4vci: 'OpenID for Verifiable Credential Issuance',
  oid4vp: 'OpenID for Verifiable Presentations',
  qtsp: 'QTSP Operations',
  'trust-list': 'Trust List Publication',
};

export async function generateStaticParams() {
  const controls = await loadAllControls();
  return controls.map((c) => ({
    module: c.module,
    id: controlIdToSlug(c.id),
  }));
}

async function findControl(
  moduleSlug: string,
  idSlug: string,
): Promise<{ control: Control; controls: Control[] } | null> {
  const controls = await loadAllControls();
  const canonical = slugToControlId(idSlug, controls);
  if (!canonical) return null;
  const control = controls.find(
    (c) => c.id === canonical && c.module === moduleSlug,
  );
  if (!control) return null;
  return { control, controls };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { module: moduleSlug, id } = await params;
  const found = await findControl(moduleSlug, id);
  if (!found) return {};
  const { control } = found;
  const description =
    control.plain_english === 'TODO'
      ? firstSentence(control.spec_text)
      : firstSentence(control.plain_english);
  const url = `/modules/${moduleSlug}/controls/${id}/`;
  return {
    title: `${control.id} · ${control.short_title} · iGrant.io`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${control.id}: ${control.short_title}`,
      description,
      type: 'article',
      url,
    },
  };
}

function RequirementLevelBadge({ level }: { level: Control['requirement_level'] }) {
  const styles = {
    shall:
      'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    should:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    may: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  } as const;
  return (
    <HoverTooltip label={requirementLevelTooltip(level)} side="bottom">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles[level]}`}
      >
        {level}
      </span>
    </HoverTooltip>
  );
}

function FacetBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      {children}
    </span>
  );
}

export default async function ControlPage({ params }: PageProps) {
  const { module: moduleSlug, id } = await params;
  const found = await findControl(moduleSlug, id);
  if (!found) notFound();
  const { control, controls } = found;

  const isStub = control.plain_english === 'TODO';

  const related = control.related_controls
    .map((rid) => controls.find((c) => c.id === rid))
    .filter((c): c is Control => Boolean(c));

  const description = (isStub ? control.spec_text : control.plain_english).slice(
    0,
    160,
  );
  const moduleUrl = `https://eudi-wallet-compliance.igrant.io/modules/${control.module}/`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${control.id}: ${control.short_title}`,
    description,
    author: {
      '@type': 'Organization',
      name: 'iGrant.io',
      url: 'https://igrant.io',
    },
    publisher: {
      '@type': 'Organization',
      name: 'iGrant.io',
      url: 'https://igrant.io',
    },
    datePublished: REVIEW_DATE,
    dateModified: REVIEW_DATE,
    articleBody: isStub ? control.spec_text : control.plain_english,
    about: {
      '@type': 'Thing',
      name: `${control.spec_source.document} ${control.spec_source.version} clause ${control.spec_source.clause}`,
    },
    isPartOf: { '@type': 'WebSite', name: 'EUDI Wallet Compliance', url: moduleUrl },
  };

  const moduleName = MODULE_LABEL[control.module] ?? control.module;

  return (
    <article
      className="mx-auto max-w-6xl px-6 py-12 sm:py-16"
      data-pagefind-body
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Search index metadata and filters: read by Pagefind from data attrs;
          spans render no visible text and their attribute values stay out
          of the body excerpt. */}
      <div className="hidden" aria-hidden="true">
        <span data-pagefind-meta={`control_id:${control.id}`} />
        <span data-pagefind-meta={`short_title:${control.short_title}`} />
        <span data-pagefind-meta={`module:${control.module}`} />
        <span
          data-pagefind-meta={`title:${control.id}: ${control.short_title}`}
        />
        <span data-pagefind-filter={`requirement_level:${control.requirement_level}`} />
        {control.applies_to.map((t) => (
          <span key={`f-tier-${t}`} data-pagefind-filter={`applies_to:${t}`} />
        ))}
        {control.profile.map((p) => (
          <span key={`f-profile-${p}`} data-pagefind-filter={`profile:${p}`} />
        ))}
        {control.role.map((r) => (
          <span key={`f-role-${r}`} data-pagefind-filter={`role:${r}`} />
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-zinc-200 pb-10 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          <Link href={`/modules/${control.module}/`} className="hover:underline">
            {moduleName}
          </Link>
          <span className="mx-2 text-zinc-400" aria-hidden="true">/</span>
          {control.spec_source.document} ({control.spec_source.version}) clause {control.spec_source.clause}
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem] dark:text-white">
          <span className="font-mono text-blue-700 dark:text-blue-400">
            {control.id}
          </span>
          <span className="mx-2 text-zinc-400">:</span>
          <span className="text-zinc-950 dark:text-white">
            {control.short_title}
          </span>
        </h1>

        {/* Facet badges */}
        <ul className="mt-6 flex flex-wrap items-center gap-2">
          <li>
            <RequirementLevelBadge level={control.requirement_level} />
          </li>
          {control.applies_to.map((tier) => (
            <li key={`tier-${tier}`}>
              <FacetBadge>{APPLIES_TO_LABEL[tier] ?? tier}</FacetBadge>
            </li>
          ))}
          {control.profile.map((p) => (
            <li key={`profile-${p}`}>
              <FacetBadge>{PROFILE_LABEL[p] ?? p}</FacetBadge>
            </li>
          ))}
          {control.role.map((r) => (
            <li key={`role-${r}`}>
              <FacetBadge>{ROLE_LABEL[r] ?? r}</FacetBadge>
            </li>
          ))}
        </ul>
      </header>

      <div className="grid grid-cols-1 gap-12 pt-12 lg:grid-cols-3 lg:gap-16">
        {/* Main column */}
        <div className="lg:col-span-2">
          {/* Spec text */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
              Spec text
            </h2>
            <blockquote className="mt-3 border-l-4 border-blue-200 bg-blue-50/50 px-5 py-4 text-base leading-relaxed text-zinc-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-zinc-200">
              {control.spec_text}
            </blockquote>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              {control.spec_source.document} ({control.spec_source.version}),
              clause {control.spec_source.clause}
              {control.spec_source.page ? `, page ${control.spec_source.page}` : ''}.
            </p>
          </section>

          {/* Plain English */}
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
              In plain English
            </h2>
            {isStub ? (
              <div className="mt-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
                Plain-English explanation has not yet been written for this
                control. The spec text above carries the normative requirement.
              </div>
            ) : (
              <p className="mt-3 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
                {control.plain_english}
              </p>
            )}
          </section>

          {/* Why it matters */}
          {control.why_it_matters && (
            <section className="mt-10">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                Why it matters
              </h2>
              <p className="mt-3 text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
                {control.why_it_matters}
              </p>
            </section>
          )}

          {/* Common mistakes */}
          {control.common_mistakes.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                Common mistakes
              </h2>
              <ul className="mt-3 space-y-2">
                {control.common_mistakes.map((mistake, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 text-base leading-relaxed text-zinc-800 dark:text-zinc-200"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"
                    />
                    {mistake}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Conformance check */}
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
              Conformance check
            </h2>
            {control.check_function ? (
              <p className="mt-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                <span className="text-zinc-500">function</span>{' '}
                <span className="text-blue-700 dark:text-blue-400">
                  {control.check_function}
                </span>
                <span className="text-zinc-500">()</span>
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
                (Check function not yet implemented. The conformance engine
                will gain this rule in a future release.)
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-8">
            {/* Related controls (top: most-used by engineers in flow) */}
            {related.length > 0 && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                  Related controls
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/modules/${r.module}/controls/${controlIdToSlug(r.id)}/`}
                        className="group block"
                      >
                        <p className="font-mono text-xs font-semibold text-blue-700 group-hover:underline dark:text-blue-400">
                          {r.id}
                        </p>
                        <p className="mt-0.5 text-sm leading-snug text-zinc-700 group-hover:text-zinc-950 dark:text-zinc-300 dark:group-hover:text-white">
                          {r.short_title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Spec source */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                Spec source
              </h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-500">Document</dt>
                  <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {control.spec_source.document}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-500">Version</dt>
                  <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {control.spec_source.version}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500 dark:text-zinc-500">Clause</dt>
                  <dd className="text-right font-mono text-zinc-900 dark:text-zinc-100">
                    {control.spec_source.clause}
                  </dd>
                </div>
                {control.spec_source.page && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500 dark:text-zinc-500">Page</dt>
                    <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {control.spec_source.page}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Evidence to satisfy */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-500">
                Evidence to satisfy
              </h2>
              <ul className="mt-3 space-y-3">
                {control.evidence_type.map((e) => {
                  const meta = EVIDENCE_LABEL[e];
                  return (
                    <li key={e}>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {meta?.name ?? ucfirst(e)}
                      </p>
                      {meta?.description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                          {meta.description}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Last reviewed against {control.spec_source.document} {control.spec_source.version}{' '}
          on {REVIEW_DATE}.
        </p>
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            iGrant.io&rsquo;s EAA Issuer SDK handles this control out of the
            box. Talk to our team about closing your conformance gaps.
          </p>
          <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0 sm:flex-row">
            <a
              href="https://wa.me/+46725082200"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Chat on WhatsApp
            </a>
            <a
              href="mailto:support@igrant.io"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:border-blue-300 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:border-blue-700 dark:hover:text-blue-300"
            >
              Email support
            </a>
          </div>
        </div>
      </footer>
    </article>
  );
}
