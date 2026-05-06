import { describe, it, expect } from 'vitest';
import { loadAllControls } from '@iwc/controls';
import { runAssessment } from '../src';
import { BUILTIN_CHECK_IDS } from '../src/checks';
import type { AssessmentScope, Evidence } from '../src/types';
import { compactFromSample, loadSample } from './checks/helpers';

describe('engine integration: full catalogue against sjv-eaa-2', () => {
  it('runs every implemented check and leaves the rest as na', async () => {
    const controls = await loadAllControls();
    const sample = await loadSample('sjv-eaa-2');
    const evidence: Evidence = {
      eaaPayload: compactFromSample(sample),
    };
    const scope: AssessmentScope = {
      module: 'eaa-conformance',
      profile: ['sd-jwt-vc'],
      role: ['issuer', 'verifier'],
      tier: 'ordinary',
    };

    const result = await runAssessment(controls, evidence, scope);

    // Implemented controls reach the registered check, so they may return
    // pass / fail / warn / na (but with a non-default note). Unimplemented
    // controls return the engine's stock 'No check implemented yet' note.
    const implementedVerdicts = result.verdicts.filter((v) =>
      BUILTIN_CHECK_IDS.includes(v.controlId),
    );
    expect(implementedVerdicts.length).toBeGreaterThan(0);
    for (const v of implementedVerdicts) {
      expect(v.notes).not.toBe('No check implemented yet');
    }

    // sjv-eaa-2 carries vct, iat, nbf, exp, cnf etc.; the structural checks
    // should clear at least a handful of passes (vct present, vct#integrity
    // present, nbf integer, exp integer, cnf present, cnf JWK valid).
    expect(result.summary.pass).toBeGreaterThan(0);

    // Unimplemented controls (still the majority) keep the default na note.
    const unimplementedVerdicts = result.verdicts.filter(
      (v) => !BUILTIN_CHECK_IDS.includes(v.controlId),
    );
    for (const v of unimplementedVerdicts) {
      expect(v.status).toBe('na');
      expect(v.notes).toBe('No check implemented yet');
    }
  });
});

describe('engine integration: profile-aware dispatch', () => {
  // Use sjv-eaa-2 as the evidence so the parsing path stays SD-JWT-VC.
  // The mdoc-only and sd-jwt-vc-only controls only differ in their
  // catalogue profile tag, not in the evidence shape; the dispatch is
  // what we are testing.
  it('drops mdoc-only controls when scope.profile is sd-jwt-vc', async () => {
    const controls = await loadAllControls();
    const sample = await loadSample('sjv-eaa-2');
    const evidence: Evidence = { eaaPayload: compactFromSample(sample) };
    const scope: AssessmentScope = {
      module: 'eaa-conformance',
      profile: ['sd-jwt-vc'],
      role: ['issuer', 'verifier'],
      tier: 'ordinary',
    };
    const result = await runAssessment(controls, evidence, scope);
    const mdocIds = result.verdicts.map((v) => v.controlId).filter((id) => id.startsWith('EAA-6.'));
    expect(mdocIds).toEqual([]);
  });

  it('drops sd-jwt-vc-only controls when scope.profile is mdoc', async () => {
    const controls = await loadAllControls();
    const sample = await loadSample('sjv-eaa-2');
    // Even with SD-JWT VC evidence, the dispatch should skip §5 entries
    // for an mdoc scope. The §5 controls would have returned na anyway
    // (kind guard inside each check) but the catalogue filter avoids
    // generating verdict rows at all.
    const evidence: Evidence = { eaaPayload: compactFromSample(sample) };
    const scope: AssessmentScope = {
      module: 'eaa-conformance',
      profile: ['mdoc'],
      role: ['issuer', 'verifier'],
      tier: 'ordinary',
    };
    const result = await runAssessment(controls, evidence, scope);
    const sdJwtIds = result.verdicts.map((v) => v.controlId).filter((id) => id.startsWith('EAA-5.'));
    expect(sdJwtIds).toEqual([]);
  });

  it('runs both §5 and §6 controls when scope.profile is [sd-jwt-vc, mdoc]', async () => {
    const controls = await loadAllControls();
    const sample = await loadSample('sjv-eaa-2');
    const evidence: Evidence = { eaaPayload: compactFromSample(sample) };
    const scope: AssessmentScope = {
      module: 'eaa-conformance',
      profile: ['sd-jwt-vc', 'mdoc'],
      role: ['issuer', 'verifier'],
      tier: 'ordinary',
    };
    const result = await runAssessment(controls, evidence, scope);
    const ids = result.verdicts.map((v) => v.controlId);
    expect(ids.some((id) => id.startsWith('EAA-5.'))).toBe(true);
    expect(ids.some((id) => id.startsWith('EAA-6.'))).toBe(true);
  });

  it('always includes clause-4 cross-cutting controls regardless of profile', async () => {
    const controls = await loadAllControls();
    const sample = await loadSample('sjv-eaa-2');
    const evidence: Evidence = { eaaPayload: compactFromSample(sample) };
    const profiles: AssessmentScope['profile'][] = [
      ['sd-jwt-vc'],
      ['mdoc'],
      ['sd-jwt-vc', 'mdoc'],
    ];
    for (const profile of profiles) {
      const result = await runAssessment(controls, evidence, {
        module: 'eaa-conformance',
        profile,
        role: ['issuer', 'verifier'],
        tier: 'ordinary',
      });
      const clause4Ids = result.verdicts
        .map((v) => v.controlId)
        .filter((id) => id.startsWith('EAA-4.'));
      expect(clause4Ids.length, `profile=${JSON.stringify(profile)}`).toBeGreaterThan(0);
    }
  });
});
