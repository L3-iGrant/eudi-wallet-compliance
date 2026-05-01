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
export { CONTROLS_BUNDLE, MODULES_BUNDLE } from './bundle/catalogue.gen';

import { CONTROLS_BUNDLE, MODULES_BUNDLE } from './bundle/catalogue.gen';
import type { ControlsCatalogue, ModuleMetadata } from './schema';

export function loadAllControlsSync(): ControlsCatalogue {
  return CONTROLS_BUNDLE;
}

export function loadModulesSync(): ModuleMetadata[] {
  return MODULES_BUNDLE;
}
