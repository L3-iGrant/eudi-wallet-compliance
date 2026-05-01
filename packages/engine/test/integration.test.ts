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
