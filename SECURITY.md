# Security policy

iGrant.io takes the security of the EUDI Wallet Compliance toolkit seriously. The toolkit influences how implementers, certification bodies, and supervisory authorities interpret conformance against Regulation (EU) 2024/1183 (the eIDAS 2 amendment) and the ETSI / ISO / IETF specifications it cites. A vulnerability that causes the engine to issue a wrong verdict, or the catalogue to misquote a normative rule, can have downstream regulatory consequences. We therefore ask reporters to follow a coordinated-disclosure process rather than filing a public issue.

## Supported versions

We accept security reports for:

- The current `main` branch.
- The most recent tagged release (see [GitHub Releases](https://github.com/L3-iGrant/eudi-wallet-compliance/releases)).

Older releases are considered case-by-case where the vulnerability has a material real-world impact.

## What counts as a security issue

In addition to the usual web-application classes (XSS, CSRF, prototype pollution, SSRF, path traversal, supply-chain compromise), please report:

- **Engine misverdict.** Conditions under which the engine issues `pass` for a credential that should fail a normative rule, or `fail` where the rule is in fact satisfied.
- **Spec misquote.** Catalogue entries whose `spec_text` materially diverges from the normative source in a way that could mislead an implementer or a certification body.
- **Status-list resolver issues.** Conditions under which the resolver fetches an unintended URL, leaks a `Referer` header to a third party, bypasses CORS, or fails open on a malformed list.
- **Dependency vulnerabilities** with a public CVE that materially affects this codebase.
- **PII leakage.** Any condition under which the web app retains, logs, or transmits user-supplied credential payloads beyond the in-memory assessment session.

Out of scope:

- Performance issues without a denial-of-service vector.
- UI bugs that do not lead to misinterpretation of a verdict.
- Behaviours clearly documented in `docs/` or `CONTRIBUTING.md`.
- Vulnerabilities in third-party services we link to but do not operate (e.g. the ETSI portal, EUR-Lex).
- Issues that require physical access to a contributor's machine.
- Self-XSS or other vulnerabilities that require the user to attack themselves.

## How to report

Send a private email to **support@igrant.io** with:

- A description of the issue and its impact.
- A minimal reproduction (input, expected output, observed output).
- The affected commit SHA or release tag.
- Optionally, your suggested fix.

You may PGP-encrypt the report. If a public key for `support@igrant.io` is not available at the time of writing, send plaintext and we will follow up with a key fingerprint.

You may also use [GitHub's private vulnerability reporting](https://github.com/L3-iGrant/eudi-wallet-compliance/security/advisories/new) to file a draft advisory directly.

Please do **not**:

- Open a public GitHub issue describing the vulnerability before a fix is available.
- Post details on social media or public mailing lists before coordinated disclosure.
- Test the vulnerability against live issuer or verifier infrastructure that is not yours.

## What to expect

- **Acknowledgement** within 5 business days of receipt.
- **Initial triage** within 14 days, including a severity rating and a provisional remediation timeline.
- **Fix release** for critical issues within 30 days; for non-critical issues, on the next scheduled release.
- **Public advisory** at coordinated-disclosure time, via [GitHub Security Advisories](https://github.com/L3-iGrant/eudi-wallet-compliance/security/advisories) and the release notes.
- **Credit** in the advisory if you wish, including a link to a write-up of your choosing.

## Coordinated disclosure timeline

We aim to ship a fix and publish an advisory within 90 days of the initial report. We will work with you on the disclosure date and adjust the timeline where the vulnerability is particularly sensitive (e.g. live exploitation observed, multiple downstream consumers affected). If 90 days elapse without progress on our side, you are free to disclose; we ask only that you let us know in advance.

## Data handling for security reports

iGrant.io, Sweden acts as data controller for security reports under Regulation (EU) 2016/679 (GDPR).

- **Lawful basis.** Legitimate interest in maintaining the security of the project (Article 6(1)(f) GDPR).
- **Data minimisation.** We retain only what is needed to triage, fix, and document the issue.
- **Retention.** Reports and associated correspondence are kept for up to 36 months from the publication of the corresponding fix, then deleted, unless we are legally obliged to retain them longer (for example, an ongoing investigation or a regulator request).
- **Your rights.** Under the GDPR you have the right to request access, rectification, erasure, and restriction of processing of your personal data. To exercise these rights, contact **support@igrant.io**.

## Hall of fame

We will keep a list of reporters who have helped harden the project. If you would prefer to remain anonymous, let us know at the time of disclosure.
