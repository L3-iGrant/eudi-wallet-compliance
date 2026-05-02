import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsLayout } from '@/components/DocsLayout';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'How the controls catalogue is maintained, which spec versions we track, what the toolkit does NOT do, and the scope boundaries of the assessment.',
  alternates: { canonical: '/eudi-wallet-compliance/docs/methodology/' },
};

export default function Methodology() {
  return (
    <DocsLayout
      currentSlug="methodology"
      title="Methodology"
      lastReviewed="2026-05-02"
    >
      <h2>How the controls catalogue is maintained</h2>
      <p>
        Every control in the catalogue is extracted directly from the
        underlying spec and committed as a YAML entry under{' '}
        <code>packages/controls/data/</code> in the open-source repository.
        The full schema, the field reference, and the step-by-step flow for
        adding new controls or engine checks live in{' '}
        <a
          href="https://github.com/L3-iGrant/eudi-wallet-compliance/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          CONTRIBUTING.md
        </a>{' '}
        on GitHub.
      </p>
      <p>
        Per-entry, the YAML record carries the canonical id (e.g.{' '}
        <code>EAA-5.2.10.1-04</code>), the spec source citation (document,
        version, clause, page), the modal verb (shall / should / may), the
        applicable tiers, the applicable profiles, the role(s) it binds, the
        kinds of evidence needed to evaluate it, the verbatim spec text, and
        a hand-written plain-English explanation.
      </p>
      <p>
        Spec text is reproduced verbatim and is the source of truth. The
        plain-English field is editorial and gets refined over time; controls
        whose plain-English is still being drafted are explicitly marked{' '}
        <code>TODO</code>.
      </p>
      <p>
        When the underlying spec revises, every affected entry gets its
        version field bumped and the spec text and clause reference updated.
        Reviews are tracked in commits; the catalogue's git history is the
        audit trail.
      </p>

      <h2>Spec version policy</h2>
      <p>
        The catalogue tracks the latest published version of each upstream
        spec as soon as we can. Currently:
      </p>
      <ul>
        <li>
          <strong>ETSI TS 119 472-1 v1.2.1.</strong> The primary source for
          the EAA Conformance module's normative requirements.
        </li>
        <li>
          <strong>IETF draft-ietf-oauth-sd-jwt-vc.</strong> Latest active
          draft for SD-JWT VC structure and serialisation rules.
        </li>
        <li>
          <strong>IETF draft-ietf-oauth-status-list.</strong> Latest active
          draft for the runtime status-list resolver.
        </li>
        <li>
          <strong>RFC 7517 / 7519.</strong> JWK and JWT base specs, used by
          structural cnf checks.
        </li>
      </ul>
      <p>
        When a spec moves from draft to RFC, we re-extract the catalogue
        entries that cite it and regenerate the bundle. The same version
        number that we track shows up in every relevant control's{' '}
        <code>spec_source</code> field.
      </p>

      <h2>Scope boundaries</h2>
      <p>
        The toolkit covers what can be checked from the artefacts an issuer
        actually produces. Today that means:
      </p>
      <ul>
        <li>
          <strong>Structural checks</strong> on the SD-JWT VC compact form
          (claim presence, type, value range, mutex relationships).
        </li>
        <li>
          <strong>Runtime resolution</strong> of the IETF Token Status List
          referenced from the credential.
        </li>
        <li>
          <strong>Tier-aware behaviour</strong> for cross-cutting rules like
          the shortLived/status mutex.
        </li>
        <li>
          <strong>Gap analysis</strong> projecting the same evidence to QEAA
          and PuB-EAA tiers, with both behaviour-aware and catalogue-delta
          signals.
        </li>
      </ul>

      <h2>What the toolkit does NOT do</h2>
      <p>
        Several material things are explicitly out of scope today, either
        because the upstream infrastructure does not exist, or because the
        scope is bigger than a public free toolkit can carry, or because the
        check requires evidence beyond what an EAA artefact alone supplies.
      </p>
      <ul>
        <li>
          <strong>No cryptographic signature verification.</strong> The
          engine parses the JWS but does not validate the issuer's signature
          against a trust anchor. Signature verification arrives with the
          trust-list integration (see roadmap).
        </li>
        <li>
          <strong>No notified-body audit.</strong> Pass on every implemented
          check is not the same as a notified-body conformance certificate.
          Use this toolkit as a regression gate and a pre-flight; for the
          formal certification step you still need an accredited assessor.
        </li>
        <li>
          <strong>No mdoc support yet.</strong> Profile selection accepts
          ISO mdoc but no checks are wired against the mdoc structure
          today. The placeholder reflects the catalogue surface; runtime
          coverage follows.
        </li>
        <li>
          <strong>No verifier-behaviour checks.</strong> Controls that bind
          the verifier (must consult trust list before accepting; must
          enforce key binding on presentation) are in the catalogue but
          require evidence beyond the EAA artefact (verification log, trust
          list config, presentation log). Those evidence types are on the
          roadmap.
        </li>
        <li>
          <strong>No user-data extraction.</strong> The toolkit reads only
          the structural claims of the credential. It does not surface the
          subject's personal attributes back to you in the report and never
          transmits them anywhere.
        </li>
      </ul>

      <h2>Calibration against ETSI Plugtests</h2>
      <p>
        The reference samples library is named to mirror the ETSI EAA
        Plugtests SJV-EAA test-case ids (sjv-eaa-1 through sjv-eaa-7
        currently). Where ETSI publishes a descriptor (pseudonym, oneTime,
        ShortLived) the corresponding sample exercises that exact claim.
        Exact alignment with the Plugtests scoring matrix is a continuous
        process; the catalogue and the samples are the working surface.
      </p>
      <p>
        See{' '}
        <Link href="/modules/eaa-conformance/reference-samples/">
          /reference-samples/
        </Link>{' '}
        for the live list and per-sample descriptions.
      </p>
    </DocsLayout>
  );
}
