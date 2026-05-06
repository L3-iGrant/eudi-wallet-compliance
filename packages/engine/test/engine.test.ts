import { describe, it, expect, beforeEach } from 'vitest';
import type { Control } from '@iwc/controls';
import {
  runAssessment,
  filterControlsForScope,
  registerCheck,
  checkRegistry,
} from '../src/index';
import type { AssessmentScope } from '../src/types';

function makeControl(overrides: Partial<Control> & Pick<Control, 'id'>): Control {
  return {
    module: 'eaa-conformance',
    spec_source: { document: 'ETSI TS X', version: 'v1', clause: '1' },
    requirement_level: 'shall',
    applies_to: ['ordinary-eaa', 'qeaa', 'pub-eaa'],
    profile: ['sd-jwt-vc'],
    role: ['issuer', 'verifier'],
    evidence_type: ['eaa-payload'],
    short_title: 'A short title for the test fixture',
    spec_text: 'Spec text for the test fixture, long enough.',
    plain_english: 'TODO',
    common_mistakes: [],
    related_controls: [],
    ...overrides,
  } as Control;
}

const sdJwtIssuerVerifierAll = makeControl({ id: 'EAA-5.1-01' });
const qeaaIssuerOnly = makeControl({
  id: 'QEAA-5.6.2-01',
  applies_to: ['qeaa'],
  role: ['issuer'],
});
const mdocControl = makeControl({
  id: 'EAA-6.1-01',
  profile: ['mdoc'],
});
const abstractControl = makeControl({
  id: 'EAA-4.2.6.6-01',
  profile: ['sd-jwt-vc', 'mdoc'],
});

const sampleControls: Control[] = [
  sdJwtIssuerVerifierAll,
  qeaaIssuerOnly,
  mdocControl,
  abstractControl,
];

const sdJwtScope: AssessmentScope = {
  module: 'eaa-conformance',
  profile: ['sd-jwt-vc'],
  role: ['issuer', 'verifier'],
  tier: 'ordinary',
};

beforeEach(() => {
  // Reset the registry between tests so registrations leak no further.
  for (const k of Object.keys(checkRegistry)) {
    delete checkRegistry[k];
  }
});

describe('filterControlsForScope', () => {
  it('keeps SD-JWT VC controls and excludes mdoc-only when scope is sd-jwt-vc', () => {
    const out = filterControlsForScope(sampleControls, sdJwtScope);
    const ids = out.map((c) => c.id);
    expect(ids).toContain('EAA-5.1-01');
    expect(ids).not.toContain('EAA-6.1-01');
  });

  it('always includes cross-cutting controls regardless of which concrete scope.profile is selected', () => {
    // Cross-cutting clause-4 controls declare both concrete profiles
    // (`profile: [sd-jwt-vc, mdoc]`) so they fire on any single-profile
    // assessment.
    const out = filterControlsForScope(sampleControls, sdJwtScope);
    expect(out.map((c) => c.id)).toContain('EAA-4.2.6.6-01');
    const mdocOut = filterControlsForScope(sampleControls, {
      ...sdJwtScope,
      profile: ['mdoc'],
    });
    expect(mdocOut.map((c) => c.id)).toContain('EAA-4.2.6.6-01');
  });

  it('excludes QEAA-only controls when scope.tier is ordinary', () => {
    const out = filterControlsForScope(sampleControls, sdJwtScope);
    expect(out.map((c) => c.id)).not.toContain('QEAA-5.6.2-01');
  });

  it('includes QEAA-only controls when scope.tier is qeaa', () => {
    const out = filterControlsForScope(sampleControls, {
      ...sdJwtScope,
      tier: 'qeaa',
    });
    expect(out.map((c) => c.id)).toContain('QEAA-5.6.2-01');
  });

  it('respects role intersection: a verifier-only scope drops issuer-only controls', () => {
    const out = filterControlsForScope(sampleControls, {
      ...sdJwtScope,
      tier: 'qeaa',
      role: ['verifier'],
    });
    expect(out.map((c) => c.id)).not.toContain('QEAA-5.6.2-01');
  });

  it('maps tier "ordinary" to applies_to "ordinary-eaa"', () => {
    const ordinaryOnly = makeControl({
      id: 'EAA-TEST-ORD',
      applies_to: ['ordinary-eaa'],
    });
    const out = filterControlsForScope([ordinaryOnly], sdJwtScope);
    expect(out).toHaveLength(1);
  });

  it('keeps controls whose applies_to contains "all" regardless of tier', () => {
    const universal = makeControl({
      id: 'EAA-TEST-ALL',
      applies_to: ['all'],
    });
    for (const tier of ['ordinary', 'qeaa', 'pub-eaa'] as const) {
      const out = filterControlsForScope([universal], { ...sdJwtScope, tier });
      expect(out, `tier=${tier}`).toHaveLength(1);
    }
  });
});

describe('runAssessment', () => {
  it('returns all-na verdicts when no checks are registered', async () => {
    const result = await runAssessment(sampleControls, {}, sdJwtScope);
    expect(result.verdicts.length).toBeGreaterThan(0);
    for (const v of result.verdicts) {
      expect(v.status).toBe('na');
      expect(v.notes).toBe('No check implemented yet');
    }
    expect(result.summary.na).toBe(result.verdicts.length);
    expect(result.summary.pass).toBe(0);
    expect(result.summary.fail).toBe(0);
    expect(result.summary.warn).toBe(0);
  });

  it('uses a registered check function when one is available', async () => {
    registerCheck('EAA-5.1-01', async () => ({
      controlId: 'EAA-5.1-01',
      status: 'pass',
      evidenceRef: 'eaa-payload',
      notes: 'header.typ is vc+sd-jwt',
    }));
    // Phase 7: runAssessment short-circuits to na when the EAA payload is
    // absent or fails to parse, so a registered check is only invoked
    // when parsing succeeds. Pass a minimal well-formed compact form so
    // the dispatch reaches the registered function.
    const minimalCompact =
      'eyJhbGciOiJub25lIn0.eyJ2Y3QiOiJ1cm46dGVzdC92MSJ9.placeholder~';
    const result = await runAssessment(
      sampleControls,
      { eaaPayload: minimalCompact },
      sdJwtScope,
    );
    const verdict = result.verdicts.find((v) => v.controlId === 'EAA-5.1-01');
    expect(verdict?.status).toBe('pass');
    expect(verdict?.notes).toBe('header.typ is vc+sd-jwt');
    expect(result.summary.pass).toBe(1);
  });

  it('defaults tenantId to "public-default" when not supplied', async () => {
    const result = await runAssessment(sampleControls, {}, sdJwtScope);
    expect(result.tenantId).toBe('public-default');
  });

  it('uses the supplied tenantId verbatim when provided', async () => {
    const result = await runAssessment(sampleControls, {}, sdJwtScope, {
      tenantId: 'workspace-acme',
    });
    expect(result.tenantId).toBe('workspace-acme');
  });

  it('generates a valid v4-shaped UUID for reportId', async () => {
    const result = await runAssessment(sampleControls, {}, sdJwtScope);
    expect(result.reportId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('lists evidenceRefs for the keys actually supplied in evidence', async () => {
    const result = await runAssessment(
      sampleControls,
      { eaaPayload: 'JWT~D~', issuerCert: '-----BEGIN-----' },
      sdJwtScope,
    );
    expect(result.evidenceRefs).toContain('eaaPayload');
    expect(result.evidenceRefs).toContain('issuerCert');
    expect(result.evidenceRefs).not.toContain('statusListUrl');
  });

  it('populates gapAnalysis with behavioural and static tier projections', async () => {
    const result = await runAssessment(sampleControls, {}, sdJwtScope);
    // With no evidence, every check returns na, so no behavioural fails
    // at any higher tier. The static catalogue delta still flags
    // QEAA-only controls in the fixture set as additionally required.
    expect(result.gapAnalysis.canBeQeaa).toBe(true);
    expect(result.gapAnalysis.missingForQeaa).toEqual([]);
    expect(result.gapAnalysis.canBePubEaa).toBe(true);
    expect(result.gapAnalysis.missingForPubEaa).toEqual([]);
    // QEAA-5.6.2-01 in the fixture has applies_to: ['qeaa'], so it's a
    // catalogue-level addition for the Ordinary→QEAA upgrade.
    expect(result.gapAnalysis.additionallyRequiredForQeaa).toContain(
      'QEAA-5.6.2-01',
    );
  });
});
