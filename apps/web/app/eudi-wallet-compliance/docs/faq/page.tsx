import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsLayout } from '@/components/DocsLayout';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Common questions about the EUDI Wallet Compliance toolkit: cost, privacy, accuracy, comparison to ETSI, contributions, GDPR, and more.',
  alternates: { canonical: '/eudi-wallet-compliance/docs/faq/' },
};

export default function FAQ() {
  return (
    <DocsLayout currentSlug="faq" title="FAQ" lastReviewed="2026-05-02">
      <h2>Is this free?</h2>
      <p>
        Yes. The Self-Assessment runner, the controls catalogue, the
        reference samples, and every automated test are free to use and
        published under an open-source licence. There is no signup wall and
        no rate limit.
      </p>
      <p>
        Commercial engagements (pilots, custom check authoring, notified-
        body preparation) are paid services iGrant.io offers separately.
        Reach out via the{' '}
        <Link href="/eudi-wallet-compliance/docs/about/">About page</Link> if
        you are interested.
      </p>

      <h2>Does it send my credential anywhere?</h2>
      <p>
        No. The engine, the catalogue, and the report all run inside your
        browser. Reports persist to your browser's local storage; downloads
        are produced client-side. The single exception is the runtime status-
        list resolver, which fetches the URL declared by the credential when
        you provide one. That fetch goes directly from your browser to the
        URL you supplied; no proxy, no logging, no relay.
      </p>

      <h2>How accurate is "pass"?</h2>
      <p>
        Each pass means the specific control's check passed against your
        evidence. Pass on every implemented check does not mean the
        credential is conformant overall: today the engine ships fewer
        checks than the full catalogue, and several material categories
        (signature verification, trust-list lookup, mdoc) are not yet wired.
        Read the{' '}
        <Link href="/eudi-wallet-compliance/docs/methodology/">
          Methodology
        </Link>{' '}
        page for the full scope boundaries.
      </p>
      <p>
        Use the toolkit as a regression gate during implementation and as
        evidence in your conformance pack. Use a notified body for the
        formal certification.
      </p>

      <h2>How does this compare to the ETSI Plugtests checker?</h2>
      <p>
        The ETSI Plugtests checker is the official conformance harness run
        during the Plugtests events; it has access to the trust-list and
        signature-verification infrastructure that this toolkit defers. We
        track the same SJV-EAA test-case naming and aim for byte-for-byte
        compatibility on the structural checks. The two are complementary:
        run the toolkit during day-to-day implementation, run the Plugtests
        checker for the formal scoring matrix.
      </p>

      <h2>Will there be a paid version?</h2>
      <p>
        We are exploring a paid Workspace tier that adds multi-tenant report
        history, project organisation, scheduled re-assessment, and SSO. The
        free Self-Assessment runner stays free regardless. No launch date
        committed.
      </p>

      <h2>Can I contribute a control or a check?</h2>
      <p>
        Yes. The catalogue is YAML; the engine's check functions are
        ~50-line TypeScript modules, each backed by a small set of unit
        tests. The repository's contribution guide walks through the YAML
        schema and the check-registration pattern. Most contributors land
        their first check in an afternoon. Issues and pull requests welcome
        at{' '}
        <a
          href="https://github.com/L3-iGrant/eudi-wallet-compliance"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/L3-iGrant/eudi-wallet-compliance
        </a>
        .
      </p>

      <h2>Other languages?</h2>
      <p>
        The site is published in British English today. Every page tags{' '}
        <code>lang="en-GB"</code>. We are open to community translations
        when the catalogue stabilises; localisation lands as a project once
        the spec coverage is broader.
      </p>

      <h2>Is the site accessible?</h2>
      <p>
        We aim for WCAG 2.1 AA. Every page renders meaningful keyboard
        navigation, the dropdowns and modals are screen-reader navigable,
        and contrast is checked against the WCAG ratios in light and dark
        modes. Issues are taken seriously; report them as a GitHub issue
        and we will treat them as a bug, not as a nice-to-have.
      </p>

      <h2>Where is the source code?</h2>
      <p>
        Everything is on GitHub at{' '}
        <a
          href="https://github.com/L3-iGrant/eudi-wallet-compliance"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/L3-iGrant/eudi-wallet-compliance
        </a>
        . The repo is open-source and contains the full publishing pipeline
        (catalogue, engine, reference samples, generator, web app).
      </p>

      <h2>How does GDPR apply?</h2>
      <p>
        Reports stay in your browser, so no personal data leaves your
        device when you run an assessment. The email captured at the
        download gate is stored in <code>localStorage</code> alongside the
        report id, with a 365-day TTL; you can clear your browser's site
        data at any point to remove it. We do not send the email to a
        third party. See{' '}
        <Link href="/eudi-wallet-compliance/docs/privacy/">
          Privacy
        </Link>{' '}
        for the full picture and the analytics stance.
      </p>

      <h2>What if I find a bug or a wrong control?</h2>
      <p>
        Open an issue on GitHub with a minimal reproduction. For controls,
        cite the spec source you think we have got wrong; for engine bugs,
        a sample EAA that demonstrates the issue is ideal. We treat
        accuracy bugs as the highest-priority class.
      </p>
    </DocsLayout>
  );
}
