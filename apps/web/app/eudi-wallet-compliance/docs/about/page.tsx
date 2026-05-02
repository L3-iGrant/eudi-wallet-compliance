import type { Metadata } from 'next';
import { DocsLayout } from '@/components/DocsLayout';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Who maintains the EUDI Wallet Compliance toolkit, why it was built, and where to find the source code and the team.',
  alternates: { canonical: '/eudi-wallet-compliance/docs/about/' },
};

export default function About() {
  return (
    <DocsLayout currentSlug="about" title="About" lastReviewed="2026-05-02">
      <h2>Who builds this</h2>
      <p>
        The EUDI Wallet Compliance toolkit is built and maintained by{' '}
        <a
          href="https://igrant.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          iGrant.io
        </a>
        , an EU Digital Identity and European Business Wallet software
        provider for regulated industries. We are a Stockholm-based team
        that has worked on consent, data rights, and identity infrastructure
        since 2019; our software is production-proven and eIDAS 2.0-ready
        across credential workflows that span the individual EUDI Wallet and
        the European Business Wallet.
      </p>

      <h2>Why we built it</h2>
      <p>
        The reference specs for EUDI Wallet and European Business Wallet
        credentials are scattered across ETSI, IETF, ISO, OpenID, and W3C
        documents. Each is technically precise and individually correct, but
        stitching them into a single view of "what does my issuer have to
        do" is a non-trivial reading exercise that every implementer ends up
        repeating. The toolkit condenses that reading exercise into a
        runnable engine and a permanent, browseable catalogue that links
        each rule back to its source clause.
      </p>
      <p>
        We use the same toolkit ourselves on the iGrant.io products that
        issue and verify regulated credentials, including Person
        Identification Data (PID), Legal Person Identification Data /
        European Business Wallet Organisation ID (LPID / EBWOID),
        Electronic Attestations of Attributes (EAAs), Qualified EAAs
        (QEAAs), and Payment Wallet Attestations. Open-sourcing it keeps us
        honest, lets the community fix our gaps, and gives other
        implementers a free starting point across the EUDI Wallet and
        European Business Wallet ecosystems.
      </p>

      <h2>Where the source lives</h2>
      <p>
        Every line of this site, the catalogue YAML, the engine, the
        reference samples, and the publishing infrastructure live in a
        single open-source monorepo on GitHub:
      </p>
      <p>
        <a
          href="https://github.com/L3-iGrant/eudi-wallet-compliance"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/L3-iGrant/eudi-wallet-compliance
        </a>
      </p>
      <p>
        Issues and pull requests are welcome. New control entries, fixes to
        plain-English explanations, additional reference samples, and new
        engine checks are all in scope. See the README for the contribution
        flow.
      </p>

      <h2>Reach the team</h2>
      <p>
        For commercial conversations (pilots, custom implementations,
        notified-body prep), email{' '}
        <a href="mailto:support@igrant.io">support@igrant.io</a>. For quick
        questions a WhatsApp chat is fastest:{' '}
        <a
          href="https://wa.me/+46725082200"
          target="_blank"
          rel="noopener noreferrer"
        >
          +46 72 508 22 00
        </a>
        .
      </p>
    </DocsLayout>
  );
}
