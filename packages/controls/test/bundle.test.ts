import { describe, it, expect } from 'vitest';
import {
  CONTROLS_BUNDLE,
  MODULES_BUNDLE,
  loadAllControls,
  loadAllControlsSync,
  loadModules,
  loadModulesSync,
  ControlsCatalogueSchema,
  ModulesCatalogueSchema,
} from '../src';

describe('bundle (browser-safe sync exports)', () => {
  it('parses against the catalogue schema', () => {
    const result = ControlsCatalogueSchema.safeParse(CONTROLS_BUNDLE);
    expect(result.success).toBe(true);
  });

  it('parses against the modules schema', () => {
    const result = ModulesCatalogueSchema.safeParse(MODULES_BUNDLE);
    expect(result.success).toBe(true);
  });

  it('matches the YAML source for controls (run build:bundle if this fails)', async () => {
    const fromYaml = await loadAllControls();
    expect(loadAllControlsSync()).toEqual(fromYaml);
  });

  it('matches the YAML source for modules (run build:bundle if this fails)', async () => {
    const fromYaml = await loadModules();
    expect(loadModulesSync()).toEqual(fromYaml);
  });

  it('exposes the same data through CONTROLS_BUNDLE and loadAllControlsSync', () => {
    expect(loadAllControlsSync()).toBe(CONTROLS_BUNDLE);
  });

  it('exposes the same data through MODULES_BUNDLE and loadModulesSync', () => {
    expect(loadModulesSync()).toBe(MODULES_BUNDLE);
  });
});
