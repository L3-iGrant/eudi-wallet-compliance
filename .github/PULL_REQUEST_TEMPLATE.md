<!--
Thanks for the contribution. Fill in the relevant sections below; delete
the ones that do not apply.
-->

## Summary

<!-- One or two sentences. What does this change and why? -->

## Type of change

- [ ] Catalogue: new control entry
- [ ] Catalogue: edit to an existing control entry
- [ ] Engine: new check function
- [ ] Engine: edit to an existing check function
- [ ] Reference sample: new or updated
- [ ] Web app: copy, layout, or component change
- [ ] Docs / governance / CI

## Catalogue or engine-check checklist (delete if not applicable)

- [ ] Spec citation: `spec_source.document`, `spec_source.version`, and `spec_source.clause` are filled and match the published spec.
- [ ] `spec_text` is reproduced verbatim from the spec (capitalisation preserved).
- [ ] `requirement_level` matches the spec's exact RFC 2119 keyword (`shall` / `should` / `may`).
- [ ] `applies_to`, `profile`, `role`, `evidence_type` are correct for this rule.
- [ ] `related_controls` resolve to real catalogue ids (no orphan references).
- [ ] Ran `pnpm --filter @iwc/controls build:bundle` and committed the regenerated bundle.
- [ ] Ran `pnpm --filter @iwc/controls test` locally.
- [ ] If new engine check: added a test file with at least 3 cases (pass, fail, na).
- [ ] Ran the full repo gate locally: `pnpm lint:no-em-dashes && pnpm -r lint && pnpm -r typecheck && pnpm -r --if-present run test && pnpm --filter @iwc/web build`.

## How to verify

<!-- For UI changes: a screenshot or a localhost URL. For engine
changes: which test file covers the behaviour. For catalogue: which
clause in the spec the entry corresponds to. -->

## Notes for the reviewer

<!-- Anything you'd like the reviewer to focus on or look out for. -->
