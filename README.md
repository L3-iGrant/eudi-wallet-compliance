# EUDI Wallet Compliance Self-Assessment

[![CI](https://github.com/L3-iGrant/eudi-wallet-compliance/actions/workflows/ci.yml/badge.svg)](https://github.com/L3-iGrant/eudi-wallet-compliance/actions/workflows/ci.yml)
[![Licence: Apache-2.0](https://img.shields.io/badge/Licence-Apache_2.0-blue.svg)](./LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

A reference conformance toolkit for EUDI Wallet infrastructure providers. The catalogue carries normative controls extracted verbatim from ETSI, ISO/IEC, IETF, and EU regulatory sources; the engine evaluates real-world credentials against those controls; the web app surfaces both as a self-assessment tool that issues a downloadable conformance report.

Maintained by **iGrant.io, Sweden** under the [Apache License 2.0](./LICENSE).

## What's in scope

- **SD-JWT VC EAA** per ETSI TS 119 472-1 §5 (v1.2.1).
- **ISO/IEC mdoc EAA** per ETSI TS 119 472-1 §6 (v1.2.1), covering both mDL (ISO/IEC 18013-5) and non-mDL credentials (ISO/IEC 23220).
- **Runtime status-list resolution** per the IETF Token Status List draft, tolerating both the ETSI flat (`status.{index, uri}`) and IETF nested (`status.status_list.{idx, uri}`) shapes.

Cryptographic signature verification is deferred for both profiles in this release. Structural validation and runtime status-list resolution are live.

## Quick start

Node 24 (Active LTS) and pnpm 10 are required.

```bash
nvm install 24
nvm use 24
npm install -g pnpm@10

git clone https://github.com/L3-iGrant/eudi-wallet-compliance.git
cd eudi-wallet-compliance
pnpm install
pnpm --filter @iwc/web dev
```

Open <http://localhost:3000/eudi-wallet-compliance/>. The self-assessment flow is at `/eudi-wallet-compliance/self-assessment/`; reference samples are available from the upload page.

Run the full local gate before pushing:

```bash
pnpm lint:no-em-dashes
pnpm -r lint
pnpm -r typecheck
pnpm -r --if-present run test
pnpm --filter @iwc/web build
```

## Repository layout

- `apps/web` Next.js application: public site, assessment runner, downloadable PDF report.
- `packages/controls` YAML controls catalogue and Zod schemas; a generated browser bundle.
- `packages/engine` Stateless conformance engine; one verdict function per control.
- `packages/status-list` IETF Token Status List fetcher and validator.
- `packages/shared` Shared types and utilities, including the SD-JWT VC and mdoc parsers.
- `tools/extract-controls` One-off seed script for controls extraction from spec PDFs.
- `tools/generate-samples` Reference-sample generator (`generate` for SD-JWT VC, `generate:mdoc` for mdoc).

## Contributing

We welcome contributions from issuers, verifiers, wallet vendors, certification bodies, and the wider EUDI Wallet community. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for:

- Catalogue entries (adding a control, with spec citation).
- Engine checks (one verdict function per rule).
- Reference samples (synthetic data only).
- Privacy and synthetic-data requirements.
- Specification-text attribution rules.
- Accessibility targets (WCAG 2.1 AA).

Every commit must carry a `Signed-off-by:` trailer (Developer Certificate of Origin 1.1). Inbound contributions are licensed under Apache 2.0; no separate CLA is required.

## Conventions

- British English throughout, except for terms taken verbatim from specifications (`iss`, `vct`, `sub`, etc.).
- No em dashes anywhere (CI-enforced).
- Conventional Commits.
- WCAG 2.1 Level AA for UI changes.

## Security

To report a security vulnerability privately, see [`SECURITY.md`](./SECURITY.md). Do **not** open a public GitHub issue for security matters.

## Code of Conduct

Participants are expected to follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Reports go to **conduct@igrant.io**.

## Licence

Licensed under the [Apache License, Version 2.0](./LICENSE).

Copyright (c) 2026 iGrant.io, Sweden.

Third-party notices and attribution: see [`NOTICE`](./NOTICE).

## Contact

- Commercial enquiries: <support@igrant.io>
- Security disclosures: <security@igrant.io> (see [`SECURITY.md`](./SECURITY.md))
- Code of Conduct concerns: <conduct@igrant.io>
- Data-protection requests (GDPR): <privacy@igrant.io>
