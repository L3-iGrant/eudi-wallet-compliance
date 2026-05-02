import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsLayout } from '@/components/DocsLayout';

export const metadata: Metadata = {
  title: 'Getting started',
  description:
    'Run your first EUDI Wallet Compliance Self-Assessment in five minutes. Pick a scope, paste an EAA, read the verdict.',
  alternates: { canonical: '/eudi-wallet-compliance/docs/getting-started/' },
};

export default function GettingStarted() {
  return (
    <DocsLayout
      currentSlug="getting-started"
      title="Getting started"
      lastReviewed="2026-05-02"
    >
      <p>
        The Self-Assessment runs every implemented engine check against an
        Electronic Attestation of Attributes (EAA) you supply, then produces a
        downloadable report. It runs entirely in your browser; nothing about
        your credential is sent to a server. The whole flow takes about five
        minutes the first time.
      </p>

      <h2>1. Pick a scope</h2>
      <p>
        Open{' '}
        <Link href="/eudi-wallet-compliance/self-assessment/">
          /eudi-wallet-compliance/self-assessment/
        </Link>{' '}
        and choose four things on the form:
      </p>
      <ul>
        <li>
          <strong>Module.</strong> Today the only available module is{' '}
          <em>EAA Conformance</em>, which covers ETSI TS 119 472-1. The other
          modules in the dropdown are placeholders for future releases.
        </li>
        <li>
          <strong>Role.</strong> Tick Issuer if you are testing what you issue,
          or Verifier if you are testing how a verifier should validate the
          credential. You can tick both, in which case the engine includes
          every control whose declared role intersects with either selection.
        </li>
        <li>
          <strong>Profile.</strong> Tick SD-JWT VC, ISO mdoc, or both. The
          available checks today exercise the SD-JWT VC profile; mdoc support
          is on the roadmap.
        </li>
        <li>
          <strong>Tier.</strong> Pick Ordinary EAA, QEAA, or PuB-EAA. This
          drives both the in-scope control set and the gap-analysis
          projections to higher tiers.
        </li>
      </ul>
      <p>
        Click <strong>Continue</strong>. The scope is persisted to URL search
        parameters so you can share or bookmark a particular flow.
      </p>

      <h2>2. Upload your evidence</h2>
      <p>
        On the upload step, paste your SD-JWT VC compact serialisation into
        the <strong>EAA payload</strong> field, or drop a file containing it.
        The field colour-codes the three JWS segments (header pink, payload
        purple, signature cyan) plus disclosures (emerald) so you can sanity-
        check the artefact at a glance. Three other inputs are optional:
      </p>
      <ul>
        <li>
          <strong>Issuer X.509 certificate</strong> in PEM form. Used by the
          trust-list lookup checks (deferred today).
        </li>
        <li>
          <strong>Status list URL</strong>. If the credential carries a
          status component, the runtime resolver fetches and parses it.
        </li>
        <li>
          <strong>Type metadata</strong>. JSON object linked to the{' '}
          <code>vct</code>.
        </li>
      </ul>
      <p>
        If you do not have a credential to hand, every entry in the{' '}
        <Link href="/modules/eaa-conformance/reference-samples/">
          reference samples library
        </Link>{' '}
        carries a <em>"Run Self-Assessment with this sample"</em> button that
        pre-fills the upload form. Useful for kicking the tyres.
      </p>

      <h2>3. Run the assessment</h2>
      <p>
        Click <strong>Run Assessment</strong>. The engine evaluates every
        in-scope control against your evidence and writes the result to your
        browser's local storage (kept for 30 days). You land on the report
        page automatically.
      </p>

      <h2>4. Read the report</h2>
      <p>
        Verdicts are grouped by clause so you can see structural results at a
        glance. Each control id links to its catalogue page where the full
        spec text and the plain-English explanation live. The summary cards
        above show pass / fail / warn / N/A counts; a small line below names
        the catalogue-coverage gap (the engine ships fewer checks than the
        full catalogue today).
      </p>
      <p>
        See{' '}
        <Link href="/eudi-wallet-compliance/docs/understanding-your-report/">
          Understanding your report
        </Link>{' '}
        for the precise meaning of each verdict and how to read the gap
        analysis.
      </p>

      <h2>5. Download or share</h2>
      <p>
        Below the verdicts, an email gate unlocks two downloads: a PDF
        suitable for circulating to a notified body or to your engineering
        team, and a JSON file with the raw{' '}
        <code>AssessmentResult</code> shape for piping into your own tooling.
        Both are produced client-side; the email is stored only in your
        browser.
      </p>

      <h2>Doing it from your CI</h2>
      <p>
        The same engine that powers the Self-Assessment runner is published
        as <code>@iwc/engine</code> in the{' '}
        <a
          href="https://github.com/L3-iGrant/eudi-wallet-compliance"
          target="_blank"
          rel="noopener noreferrer"
        >
          eudi-wallet-compliance
        </a>{' '}
        repository. Drop it into a regression test against every build of
        your issuer, parse the resulting verdicts, and fail the build on any
        new fail. The reference samples are committed to that repo too, so
        you can use them as known-good fixtures.
      </p>
    </DocsLayout>
  );
}
