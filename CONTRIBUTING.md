# Contributing to EUDI Wallet Compliance

Thank you for considering a contribution. This toolkit only earns its keep when the catalogue is accurate and the engine matches the spec, and that takes a community. This guide walks through the two most common contributions: **adding a control to the catalogue** and **adding an engine check**.

## Table of contents

- [Two paths in: GitHub web UI vs local clone](#two-paths-in-github-web-ui-vs-local-clone)
- [Local setup](#local-setup)
- [Adding a control to the catalogue](#adding-a-control-to-the-catalogue)
- [Adding an engine check](#adding-an-engine-check)
- [Conventions](#conventions)
- [Pull request flow](#pull-request-flow)
- [What reviewers look for](#what-reviewers-look-for)

## Two paths in: GitHub web UI vs local clone

You do not need to clone the repo to contribute a catalogue entry or fix a typo.

**GitHub web UI (no clone, no install).** Best for subject-matter contributors who want to edit a YAML field, fix a `spec_text` quote, or correct a `modal_verb`. Steps:

1. Open the file on github.com.
2. Click the pencil icon to edit. GitHub forks the repo automatically into your account.
3. Make the edit. The web editor highlights YAML syntax.
4. At the bottom of the page, write a commit message and click "Commit changes".
5. GitHub takes you to the PR creation screen; fill in the PR template and submit.

The catch: web-UI edits do not run the local validation gate (Zod schema, bundle drift, em-dash check). CI runs it for you on the PR; if anything fails, you'll see a red ✗ with a log link in the PR conversation. Fix by editing your branch's file again via the web UI.

For new modules, multiple file changes, or anything touching engine code or the web app, use the local clone path below.

## Local setup

For engine and web app changes, work locally. The repo is a pnpm workspace. Node 24 (Active LTS) is required.

```bash
nvm install 24
nvm use 24
npm install -g pnpm@10

git clone git@github.com:L3-iGrant/eudi-wallet-compliance.git
cd eudi-wallet-compliance
pnpm install
```

Run the local dev server:

```bash
pnpm --filter @iwc/web dev
```

Run all tests:

```bash
pnpm -r --if-present run test
```

Run the em-dash, lint, typecheck, and test gate locally before pushing:

```bash
pnpm lint:no-em-dashes
pnpm -r lint
pnpm -r typecheck
pnpm -r --if-present run test
pnpm --filter @iwc/web build
```

## Adding a control to the catalogue

A "control" is a normative requirement extracted verbatim from a specification (e.g. ETSI TS 119 472-1, an IETF draft, an ISO standard). Each control gets a YAML entry under `packages/controls/data/<module>/<file>.yaml` plus a regenerated browser bundle.

### 1. Pick the right file

For the EAA Conformance module, controls live under `packages/controls/data/eaa-conformance/`:

- `section-4.yaml` for cross-cutting Section 4 controls.
- `section-5.yaml` for SD-JWT VC profile controls (Section 5).

For other modules, create the directory and file as needed.

### 2. Compose the YAML entry

Append a new entry. Every field is validated by the Zod schema in `packages/controls/src/schema.ts`. Here is a template with every field; refer to the live `section-5.yaml` for many real examples.

```yaml
- id: EAA-5.2.1.2-04
  module: eaa-conformance
  spec_source:
    document: ETSI TS 119 472-1
    version: v1.2.1
    clause: "5.2.1.2"
    page: 23
  modal_verb: shall
  applies_to:
    - ordinary-eaa
    - qeaa
    - pub-eaa
  profile:
    - sd-jwt-vc
  role:
    - issuer
    - verifier
  evidence_type:
    - eaa-payload
  short_title: Short, scan-friendly title (5-120 characters)
  spec_text: >-
    Verbatim normative text from the spec. Reproduce as published, including
    capitalisation. The plain-English explanation goes in the next field.
  plain_english: >-
    A concrete, two-sentence explanation aimed at the implementer. What does
    this rule mean in practice? What artefact does it bind?
  why_it_matters: >-
    Optional, one-sentence motivation. What breaks if the rule is ignored?
  common_mistakes:
    - One realistic way implementations get this wrong.
    - Another realistic mistake.
  related_controls:
    - EAA-5.2.1.2-01
    - EAA-5.2.1.2-03
  check_function: optional, references engine helper if any
```

Field reference:

- `id` (required). Capitalised prefix(es) plus a clause and an optional sequence number. Pattern: `^[A-Z][A-Za-z]*(-[A-Z][A-Za-z]*)?-[\d.]+(-\d+)?$`. Examples: `EAA-5.2.1.2-01`, `QEAA-5.6.2-02`, `PuB-EAA-5.6.3-03`.
- `module` (required). One of `eaa-conformance`, `pid-lpid`, `wallet-attestation`, `oid4vci`, `oid4vp`, `qtsp`, `trust-list`.
- `spec_source` (required). `document`, `version`, `clause`, optional `page`. The clause should be a string (e.g. `"5.2.1.2"`).
- `modal_verb` (required). One of `shall`, `should`, `may`.
- `applies_to` (required). Array of `ordinary-eaa`, `qeaa`, `pub-eaa`, `all`. Use `all` for blanket rules; use specific tier names when the rule binds only to a higher tier (drives the tier gap analysis).
- `profile` (required). Array of `sd-jwt-vc`, `mdoc`, `abstract`. Use `abstract` for cross-cutting rules that apply regardless of profile.
- `role` (required). Array of `issuer`, `verifier`, `wallet`, `rp`, `qtsp`, `all`.
- `evidence_type` (required). Array of `eaa-payload`, `eaa-header`, `issuer-cert`, `status-list`, `type-metadata`, `trust-list`. Names what the engine needs to evaluate the rule.
- `short_title` (required, 5-120 chars). Renders as the catalogue table cell and the page title.
- `spec_text` (required, min 10 chars). Reproduce verbatim from the spec.
- `plain_english` (optional). Either a min-20-character explanation or the literal `TODO` placeholder. Stub controls ship with `TODO`; real controls eventually get prose.
- `why_it_matters` (optional). Single-sentence motivation.
- `common_mistakes` (optional). Array of strings, each a realistic mistake.
- `related_controls` (optional). Array of control ids that pair, contradict, or contextualise this one. Renders as cross-links on the catalogue page.
- `check_function` (optional). Free-form name pointing at an engine helper, used by the catalogue to flag controls that have an implemented check.

### 3. Regenerate the browser bundle

The catalogue ships to the browser as a pre-validated TS bundle. Regenerate after every YAML edit:

```bash
pnpm --filter @iwc/controls build:bundle
```

This rewrites `packages/controls/src/bundle/catalogue.gen.ts`. Commit the regenerated file alongside your YAML edit; CI's drift test fails the build if they ever go out of sync.

### 4. Validate

```bash
pnpm --filter @iwc/controls test
```

The schema test runs Zod against every entry. Two of the tests assert the catalogue is internally consistent (every `related_controls` id exists; every reference sample's `exercises_controls` resolves to a real id).

### 5. Stop here if you only want a catalogue entry

A control without a check still appears on the catalogue page, in the modules dropdown filter, and in the search index. It returns `na` ("No check implemented yet") whenever an assessment runs. The catalogue page is the SEO surface and works without an engine check, so contributing accurate YAML is itself useful work.

## Adding an engine check

A check is a pure function that decides one verdict for one control. Each check ships as its own file plus a test.

### 1. Pick a control

Choose a control id whose YAML entry is in the catalogue but no check yet. The report page surfaces the gap explicitly: "X of Y controls in scope have no engine check yet."

### 2. Create the check file

`packages/engine/src/checks/eaa-{slugified-id}.ts`. Slug rule: lowercase the id, replace dots with dashes (e.g. `EAA-5.2.10.1-04` becomes `eaa-5-2-10-1-04`).

```ts
import { parseSdJwtVc, ParseError } from '@iwc/shared';
import type { AssessmentScope, Evidence, Verdict } from '../types';

const CONTROL_ID = 'EAA-5.2.x.y-NN';
const EVIDENCE_REF = 'eaa-payload';

/**
 * One short paragraph stating the spec rule in your own words plus the
 * verdict matrix: what counts as pass, fail, warn, or na.
 */
export async function check(
  evidence: Evidence,
  _scope: AssessmentScope,
): Promise<Verdict> {
  if (!evidence.eaaPayload) {
    return {
      controlId: CONTROL_ID,
      status: 'na',
      evidenceRef: '',
      notes: 'No EAA payload supplied.',
    };
  }
  let payload: Record<string, unknown>;
  try {
    ({ payload } = parseSdJwtVc(evidence.eaaPayload));
  } catch (err) {
    const message = err instanceof ParseError ? err.message : (err as Error).message;
    return {
      controlId: CONTROL_ID,
      status: 'fail',
      evidenceRef: EVIDENCE_REF,
      notes: `EAA payload could not be parsed: ${message}`,
    };
  }

  // Your structural / runtime check goes here. Read fields from `payload`,
  // decide pass/fail/warn/na, return a Verdict with helpful notes.

  return {
    controlId: CONTROL_ID,
    status: 'pass',
    evidenceRef: EVIDENCE_REF,
    notes: 'Specific reason this passed.',
  };
}

export const controlId = CONTROL_ID;
```

Tier-aware checks (e.g. the shortLived/status mutex) read `scope.tier`. Replace `_scope` with `scope` and branch on the tier value. See `eaa-4-2-11-1-03.ts` for a worked example.

Runtime checks (status list resolver, trust-list lookup) call into `@iwc/status-list` or similar. See `eaa-5-2-10-2-01.ts` for the pattern; CORS-aware error messages are bubbled up via the status-list package.

### 3. Register the check

Edit `packages/engine/src/checks/index.ts`. Three additions in three places: import, `registerCheck` call, and `BUILTIN_CHECK_IDS` list. The file is alphabetised by control id; keep yours in order.

### 4. Write tests

`packages/engine/test/checks/eaa-{slug}.test.ts`. Every check ships at least 3 tests. Use the helpers in `test/checks/helpers.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { check } from '../../src/checks/eaa-...';
import { DEFAULT_SCOPE, buildCompact, compactFromSample, loadSample } from './helpers';

describe('EAA-5.2.x.y-NN (short summary)', () => {
  it('passes when the rule is satisfied', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const verdict = await check({ eaaPayload: compactFromSample(sample) }, DEFAULT_SCOPE);
    expect(verdict.status).toBe('pass');
  });

  it('fails when the rule is violated', async () => {
    const sample = await loadSample('sjv-eaa-1');
    const broken = { ...sample.decoded_payload, /* mutate */ };
    const verdict = await check(
      { eaaPayload: buildCompact(sample.decoded_header, broken) },
      DEFAULT_SCOPE,
    );
    expect(verdict.status).toBe('fail');
    expect(verdict.notes).toContain('expected substring');
  });

  it('returns na when no eaaPayload is supplied', async () => {
    const verdict = await check({}, DEFAULT_SCOPE);
    expect(verdict.status).toBe('na');
  });
});
```

Notes:

- `loadSample(id)` reads the JSON sample from `packages/controls/data/reference-samples/`.
- `compactFromSample(sample)` returns the real signed compact form for happy-path tests.
- `buildCompact(header, payload, opts)` rebuilds an unsigned compact form for negative tests where the payload was mutated. The engine does not verify signatures, so unsigned forms are fine for structural checks.
- `DEFAULT_SCOPE` is `{ module: 'eaa-conformance', profile: ['sd-jwt-vc'], role: ['issuer', 'verifier'], tier: 'ordinary' }`. Override per test as needed.

### 5. Run the gate

```bash
pnpm --filter @iwc/engine typecheck
pnpm --filter @iwc/engine test
```

Then the full repo gate:

```bash
pnpm lint:no-em-dashes
pnpm -r lint
pnpm -r typecheck
pnpm -r --if-present run test
pnpm --filter @iwc/web build
```

## Conventions

- **British English** throughout, except for terms taken verbatim from standards (Authorization header, claim names like `iss`, `vct`, `sub`, etc.).
- **No em dashes** in source, comments, commit messages, or content. Use commas, full stops, parentheses, semicolons, or colons. The CI gate fails on em dashes via `pnpm lint:no-em-dashes`.
- **Conventional Commits** for commit messages: `feat(scope): summary`, `fix(scope): summary`, `chore(scope): summary`, `refactor(scope): summary`, `docs(scope): summary`, `test(scope): summary`.
- **No AI or external attribution** beyond iGrant.io as the maintaining organisation. Do not add Co-Authored-By footers.
- **No comments narrating the change** ("added X to fix Y"). The PR description and the commit message carry that. Comments in code explain *why* something non-obvious is the way it is, not *what* the diff does.

## Pull request flow

1. Fork the repo and branch from `main` (or use the GitHub web UI flow above).
2. Make your changes following the patterns above.
3. Run the full repo gate locally before pushing (skip if you used the web UI; CI runs it for you).
4. Open a PR. Title follows Conventional Commits. The PR template prompts for a spec-citation checklist on catalogue and engine work; tick the boxes that apply.
5. CI runs lint, em-dash check, typecheck, tests, build. Green is required.
6. CODEOWNERS routes the PR to an iGrant.io maintainer automatically; merging requires at least one CODEOWNERS approval.
7. After merge, the change ships on the next deploy.

## What reviewers look for

Catalogue contributions:

- Spec citation is filled and accurate (`document`, `version`, `clause`).
- `spec_text` matches the spec verbatim, capitalisation preserved.
- `modal_verb` is the exact word from the spec (`shall` / `should` / `may`).
- `applies_to`, `profile`, `role`, `evidence_type` reflect the rule's actual scope.
- `plain_english` is either real prose (≥20 chars) or the literal `TODO` placeholder.
- `related_controls` ids resolve to real entries.
- Bundle is regenerated and committed (`build:bundle`).

Engine-check contributions:

- One file per check, named to match the slug of the control id.
- Registered in `packages/engine/src/checks/index.ts`.
- At least three tests covering pass, fail, and na branches.
- Verdict notes are user-facing copy that names the specific reason for the verdict (not generic).
- No I/O outside what `@iwc/status-list` already does (the engine should remain a pure function over the supplied evidence).

## Where to ask for help

- **Bug or accuracy issue**: open a GitHub issue with a minimal reproduction.
- **Spec interpretation question**: open a GitHub discussion. Real questions about how a spec rule should be encoded benefit from being public.
- **Commercial conversations**: email <support@igrant.io>.
