import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  ControlsCatalogueSchema,
  ModulesCatalogueSchema,
  type ControlsCatalogue,
  type ModuleMetadata,
} from './schema';

// Resolves to the bundled `data/` directory next to this package's `src/`.
// Lets callers do `loadModules()` and `loadAllControls()` without having to
// know the package's filesystem layout.
const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DATA_DIR = join(here, '..', 'data');

export async function loadControlsFromFile(filePath: string): Promise<ControlsCatalogue> {
  const raw = await readFile(filePath, 'utf8');
  const parsed = parseYaml(raw);
  return ControlsCatalogueSchema.parse(parsed);
}

export async function loadAllControls(
  dataDir: string = DEFAULT_DATA_DIR,
): Promise<ControlsCatalogue> {
  const yamlFiles: string[] = [];

  // Controls live inside per-module subdirectories of dataDir
  // (e.g. data/eaa-conformance/section-5.yaml). YAML files placed directly at
  // dataDir level are reserved for non-catalogue metadata such as modules.yaml
  // and are intentionally skipped by this walker.
  async function walk(dir: string, depth: number): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip dotfiles and draft files (basename starting with underscore).
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, depth + 1);
      } else if (depth >= 1 && entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
        yamlFiles.push(full);
      }
    }
  }

  await walk(dataDir, 0);
  const catalogues = await Promise.all(yamlFiles.map(loadControlsFromFile));
  return catalogues.flat();
}

export async function loadModules(
  dataDir: string = DEFAULT_DATA_DIR,
): Promise<ModuleMetadata[]> {
  const file = join(dataDir, 'modules.yaml');
  const raw = await readFile(file, 'utf8');
  const parsed = parseYaml(raw);
  return ModulesCatalogueSchema.parse(parsed);
}

export * from './schema';

// Browser-safe sync exports. These are pre-validated at bundle generation
// time (`pnpm --filter @iwc/controls build:bundle`) and cached as a TS
// module so the static-export site can ship the catalogue without
// touching the filesystem at runtime.
export { CONTROLS_BUNDLE, MODULES_BUNDLE } from './bundle/catalogue.gen';

import { CONTROLS_BUNDLE, MODULES_BUNDLE } from './bundle/catalogue.gen';

export function loadAllControlsSync(): ControlsCatalogue {
  return CONTROLS_BUNDLE;
}

export function loadModulesSync(): ModuleMetadata[] {
  return MODULES_BUNDLE;
}
