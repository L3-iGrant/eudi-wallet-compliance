import { describe, it, expect } from 'vitest';
import {
  loadAllControls,
  loadAllSamples,
  loadModules,
  ControlsCatalogueSchema,
  ModulesCatalogueSchema,
  ReferenceSamplesCatalogueSchema,
} from '../src';
import {
  CONTROLS_BUNDLE,
  MODULES_BUNDLE,
  SAMPLES_BUNDLE,
  loadAllControlsSync,
  loadAllSamplesSync,
  loadModulesSync,
  getSampleByIdSync,
} from '../src/sync';

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

  it('parses against the reference-samples schema', () => {
    const result = ReferenceSamplesCatalogueSchema.safeParse(SAMPLES_BUNDLE);
    expect(result.success).toBe(true);
  });

  it('matches the JSON source for samples (run build:bundle if this fails)', async () => {
    const fromDisk = await loadAllSamples();
    expect(loadAllSamplesSync()).toEqual(fromDisk);
  });

  it('exposes the same data through SAMPLES_BUNDLE and loadAllSamplesSync', () => {
    expect(loadAllSamplesSync()).toBe(SAMPLES_BUNDLE);
  });

  it('getSampleByIdSync resolves a known sample id', () => {
    const sample = getSampleByIdSync('sjv-eaa-1');
    expect(sample?.sample_id).toBe('sjv-eaa-1');
  });

  it('getSampleByIdSync returns null for unknown ids', () => {
    expect(getSampleByIdSync('nonexistent')).toBeNull();
  });
});
