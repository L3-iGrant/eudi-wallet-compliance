import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsLayout } from '@/components/DocsLayout';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What we track, what we do not, and how the EUDI Wallet Compliance toolkit is configured to be privacy-friendly by default.',
  alternates: { canonical: '/eudi-wallet-compliance/docs/privacy/' },
};

export default function Privacy() {
  return (
    <DocsLayout
      currentSlug="privacy"
      title="Privacy"
      lastReviewed="2026-05-02"
    >
      <p>
        The EUDI Wallet Compliance toolkit is designed to be useful without
        ever needing to know who you are. Two facts cover most of what we do:
      </p>
      <ul>
        <li>The credentials you assess never leave your browser.</li>
        <li>
          Pageview-level analytics is collected via Plausible, a
          cookieless and privacy-friendly tool. No personal data is
          transmitted to any analytics service.
        </li>
      </ul>

      <h2>What stays in your browser</h2>
      <p>
        The Self-Assessment engine, the catalogue, and the report renderer
        all execute as static JavaScript in your browser. The runtime status-
        list resolver, when triggered, fetches the URL declared by your
        credential directly from your browser to the published endpoint.
        There is no proxy and no relay. PDF and JSON downloads are produced
        on the client via{' '}
        <code>URL.createObjectURL</code>; the bytes never touch our server.
      </p>
      <p>
        Reports are persisted to your browser's <code>localStorage</code>{' '}
        with a 30-day TTL. The email address you submit at the download gate
        is also stored in <code>localStorage</code> alongside the matching
        report id, with a 365-day TTL. Both are cleared when you clear your
        browser's site data. We do not transmit either to a third party.
      </p>

      <h2>What we do collect</h2>
      <p>
        We use{' '}
        <a
          href="https://plausible.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Plausible
        </a>{' '}
        for aggregate, cookieless web analytics. Plausible is a
        privacy-friendly alternative to Google Analytics with no cookies,
        no fingerprinting, and explicit GDPR / CCPA compliance.
      </p>
      <p>The signals Plausible records on our behalf:</p>
      <ul>
        <li>
          <strong>Pageviews.</strong> Which pages on this site got visited,
          which referrer brought the visit. No IP address is stored.
        </li>
        <li>
          <strong>Custom events.</strong> A handful of named actions:
          assessment started, assessment completed, report downloaded,
          control page viewed, sample used. Each event includes only the
          structural metadata needed to bucket it (e.g. tier name,
          pass/fail counts, control id) and a public-tenant identifier.
          No personal data is sent.
        </li>
      </ul>
      <p>
        Plausible aggregates these signals at the page and event level and
        does not assemble them into a profile of any individual visitor.
        The full event list is in our source code under{' '}
        <code>apps/web/lib/analytics.ts</code>; you can audit it before
        opening the page if you wish.
      </p>

      <h2>What we do NOT collect</h2>
      <ul>
        <li>
          <strong>No advertising or tracking cookies.</strong> The site
          ships zero third-party trackers besides the Plausible analytics
          script.
        </li>
        <li>
          <strong>No fingerprinting.</strong> Plausible explicitly does not
          fingerprint visitors; we do not run any other fingerprinting
          script.
        </li>
        <li>
          <strong>No credential content.</strong> The bytes of your EAA, the
          issuer cert, and the type metadata stay in your browser. We have
          no copy and no way to recover them.
        </li>
        <li>
          <strong>No email-to-page joins.</strong> The email captured at
          the download gate is local to your browser. It is not transmitted
          to any analytics or marketing service. We do not link the email
          to your pageview history.
        </li>
      </ul>

      <h2>Hosting</h2>
      <p>
        The site is a static HTML/JS export served from CDN edges. There is
        no application server between you and the published assets. The
        Plausible script that runs in your browser communicates with
        Plausible's hosted endpoint directly; your IP is hashed and
        discarded by Plausible per their stated policy.
      </p>

      <h2>Questions</h2>
      <p>
        For privacy questions, email{' '}
        <a href="mailto:support@igrant.io">support@igrant.io</a>. For
        engineering specifics (which signals, where they are sent), the
        analytics code is open in the repository:{' '}
        <a
          href="https://github.com/L3-iGrant/eudi-wallet-compliance"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/L3-iGrant/eudi-wallet-compliance
        </a>
        .
      </p>
    </DocsLayout>
  );
}
