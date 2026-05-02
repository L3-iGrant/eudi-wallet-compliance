import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsLayout } from '@/components/DocsLayout';

export const metadata: Metadata = {
  title: 'Evidence types',
  description:
    'Detailed reference for every input on the Self-Assessment upload form: SD-JWT VC compact form, issuer cert, status list URL, type metadata.',
  alternates: { canonical: '/eudi-wallet-compliance/docs/evidence-types/' },
};

export default function EvidenceTypes() {
  return (
    <DocsLayout
      currentSlug="evidence-types"
      title="Evidence types"
      lastReviewed="2026-05-02"
    >
      <p>
        The upload form takes four inputs. Only the EAA payload is required;
        the other three add coverage to specific checks. This page describes
        each in detail, the format the engine expects, and the most common
        validation pitfalls.
      </p>

      <h2>EAA payload (required)</h2>
      <p>
        The Electronic Attestation of Attributes itself, in SD-JWT VC compact
        serialisation. The format is documented in{' '}
        <a
          href="https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/"
          target="_blank"
          rel="noopener noreferrer"
        >
          draft-ietf-oauth-sd-jwt-vc
        </a>
        . A compact form is a string of the shape:
      </p>
      <pre className="text-xs">
        {`<header>.<payload>.<signature>~<disclosure_1>~<disclosure_2>~...~[<kb_jwt>]`}
      </pre>
      <p>
        The first three dot-separated segments are a JWS (each a base64url-
        encoded byte string). After the signature, zero or more{' '}
        <code>~</code>-delimited disclosures may appear, followed by an
        optional Key Binding JWT in <em>presentation form</em>. <em>
          Issuance form
        </em>{' '}
        ends with a trailing <code>~</code> and no KB-JWT.
      </p>
      <p>
        The form's textarea colour-codes each segment so you can spot a
        malformed paste at a glance. A correctly-formed compact JWT lights
        up; random text does not.
      </p>
      <p>
        <strong>Common pitfalls.</strong>
      </p>
      <ul>
        <li>
          <strong>Whitespace inside the string.</strong> Some terminals wrap
          long lines and insert hard line breaks; ensure the compact form is
          a single contiguous string with no whitespace.
        </li>
        <li>
          <strong>Missing trailing tilde.</strong> An issuance-form SD-JWT
          VC ends with <code>~</code>; copy-paste truncation often loses it.
          The engine treats a compact form without any tildes as an
          unwrapped JWT and parses degraded.
        </li>
        <li>
          <strong>Wrong <code>typ</code> value.</strong> The protected header
          should declare <code>typ: dc+sd-jwt</code> (per the latest IETF
          draft). The legacy <code>vc+sd-jwt</code> still parses but is
          flagged on a future check; align to <code>dc+sd-jwt</code> when
          you can.
        </li>
      </ul>
      <p>
        If you do not have an EAA to hand, the{' '}
        <Link href="/eudi-wallet-compliance/reference-samples/">
          reference samples library
        </Link>{' '}
        publishes seven cryptographically-valid samples mirroring the ETSI
        EAA Plugtests SJV-EAA test cases. Each one has a button that
        pre-fills the upload form with a one-click run.
      </p>

      <h2>Issuer X.509 certificate (optional)</h2>
      <p>
        PEM-encoded certificate of the entity that signed the EAA. Used by
        the trust-list and signature-verification controls (deferred today;
        the toolkit accepts the cert and surfaces it in the report but does
        not verify the signature against a trust list yet).
      </p>
      <p>Expected shape:</p>
      <pre className="text-xs">
        {`-----BEGIN CERTIFICATE-----
MIIBkDCCATagAwIBAgI...
...
-----END CERTIFICATE-----`}
      </pre>
      <p>
        The textarea accepts a single PEM block. Drag a <code>.pem</code> or{' '}
        <code>.crt</code> file onto it and the contents are loaded
        automatically. If your issuer publishes a certificate chain, paste
        the leaf cert here; the full chain support arrives with the trust-
        list integration.
      </p>
      <p>
        Some EAAs already carry the cert in the JWS protected header's{' '}
        <code>x5c</code> claim. In that case you do not need to paste it
        separately; the engine reads it from the header. The field is here
        for cases where the cert is delivered out of band.
      </p>

      <h2>Status list URL (optional)</h2>
      <p>
        The HTTPS URL that publishes the credential's revocation status, per{' '}
        <a
          href="https://datatracker.ietf.org/doc/draft-ietf-oauth-status-list/"
          target="_blank"
          rel="noopener noreferrer"
        >
          draft-ietf-oauth-status-list
        </a>
        . The runtime resolver check{' '}
        <code>EAA-5.2.10.2-01</code> fetches this URL, parses the JWT or CWT
        payload, and looks up the credential's status index in the
        decompressed bitstring.
      </p>
      <p>
        The engine first tries to read the URL from{' '}
        <code>payload.status.uri</code> on your EAA payload. The form input
        is an explicit override, useful when you want to test against a
        staging endpoint, or when your credential carries a relative URL
        that needs absolutising.
      </p>
      <p>
        <strong>Common pitfalls.</strong>
      </p>
      <ul>
        <li>
          <strong>CORS not configured.</strong> The browser blocks cross-
          origin fetches that do not declare <code>Access-Control-Allow-
          Origin</code>. The verdict's notes explicitly name CORS as the
          probable cause when fetch fails.
        </li>
        <li>
          <strong>Wrong <code>Content-Type</code>.</strong> The endpoint must
          return <code>application/statuslist+jwt</code> or{' '}
          <code>application/statuslist+cwt</code>. A bare{' '}
          <code>application/json</code> is rejected.
        </li>
      </ul>

      <h2>Type metadata (optional)</h2>
      <p>
        JSON object describing the credential type, linked to from the{' '}
        <code>vct</code> claim. The format is the SD-JWT VC type metadata
        shape (claims, integrity, display info). The engine uses it to
        validate that the credential's claim names and value types match the
        type's declared schema.
      </p>
      <p>
        Paste the JSON directly into the textarea. The form validates that
        it parses as valid JSON before submitting. Type metadata is required
        for the type-integrity check{' '}
        <code>EAA-5.2.1.2-03</code> when the EAA payload carries a{' '}
        <code>vct#integrity</code> claim; without metadata the engine
        returns N/A for that check.
      </p>

      <h2>What is NOT collected</h2>
      <p>
        Nothing about your evidence leaves your browser unless you explicitly
        request the runtime resolver (status list URL fetch). The engine, the
        catalogue, and the report all run client-side. The downloaded PDF
        and JSON files are produced in your browser via{' '}
        <code>URL.createObjectURL</code>; no upload step.
      </p>
      <p>
        Reports are stored in <code>localStorage</code> under a public-tenant
        identifier and kept for 30 days; the email captured at the gate is
        stored alongside the report id, also locally. Clear your browser's
        site data to remove both at any time.
      </p>
    </DocsLayout>
  );
}
