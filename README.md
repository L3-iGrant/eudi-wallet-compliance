# EUDI Wallet Compliance Self-Assessment

The reference conformance toolkit for EUDI Wallet infrastructure providers. Maintained by iGrant.io.

Currently private. Will be open-sourced under Apache 2.0 alongside the public launch.

## Structure

- `apps/web` Next.js application: public site, assessment runner, report generator.
- `packages/controls` YAML controls catalogue and Zod schemas.
- `packages/engine` Conformance engine, stateless library.
- `packages/status-list` IETF Token Status List fetcher and validator.
- `packages/shared` Shared types and utilities.
- `tools/extract-controls` One-off seed script for controls extraction from spec PDFs.

## Local development

```
pnpm install
pnpm --filter @iwc/web dev
```

## Conventions

- British English throughout, except for terms taken verbatim from standards (Authorization header, claim names like iss, vct, sub, etc).
- No em dashes in source, comments, commit messages, or content. Use commas, full stops, parentheses, semicolons, or colons.
- Conventional Commits for commit messages.
- No external attribution beyond iGrant.io as the maintaining organisation.
