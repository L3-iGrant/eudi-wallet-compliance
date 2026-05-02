/**
 * Browser-safe entry point for `@iwc/controls`. Exports the pre-bundled
 * catalogue and modules along with sync accessors. Importing this file
 * does NOT pull in any Node-only built-ins, so it is safe from client
 * components in the static-export web app.
 *
 * Use `@iwc/controls` (the default entry) for the YAML loaders that
 * read from disk; use `@iwc/controls/sync` everywhere else.
 */

export * from './schema';
export {
  CONTROLS_BUNDLE,
  MODULES_BUNDLE,
  SAMPLES_BUNDLE,
} from './bundle/catalogue.gen';

import {
  CONTROLS_BUNDLE,
  MODULES_BUNDLE,
  SAMPLES_BUNDLE,
} from './bundle/catalogue.gen';
import type {
  ControlsCatalogue,
  ModuleMetadata,
  ReferenceSample,
} from './schema';

export function loadAllControlsSync(): ControlsCatalogue {
  return CONTROLS_BUNDLE;
}

export function loadModulesSync(): ModuleMetadata[] {
  return MODULES_BUNDLE;
}

export function loadAllSamplesSync(): ReferenceSample[] {
  return SAMPLES_BUNDLE;
}

export function getSampleByIdSync(sampleId: string): ReferenceSample | null {
  return SAMPLES_BUNDLE.find((s) => s.sample_id === sampleId) ?? null;
}
