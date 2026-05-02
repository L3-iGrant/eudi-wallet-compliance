import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import {
  ControlsCatalogueSchema,
  ModulesCatalogueSchema,
  ReferenceSamplesCatalogueSchema,
  type ControlsCatalogue,
  type ModuleMetadata,
  type ReferenceSample,
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

export async function loadAllSamples(
  dataDir: string = DEFAULT_DATA_DIR,
): Promise<ReferenceSample[]> {
  const dir = join(dataDir, 'reference-samples');
  const entries = await readdir(dir);
  const jsonFiles = entries
    .filter((f) => f.endsWith('.json') && !f.startsWith('_') && !f.startsWith('.'))
    .sort();
  const samples = await Promise.all(
    jsonFiles.map(async (f) => {
      const raw = await readFile(join(dir, f), 'utf8');
      return JSON.parse(raw) as unknown;
    }),
  );
  return ReferenceSamplesCatalogueSchema.parse(samples);
}

export * from './schema';

// Browser-safe sync exports of the pre-built bundle live in a dedicated
// entry point: `@iwc/controls/sync`. They are intentionally NOT
// re-exported here so client bundles can import the bundle without
// pulling in this module's `node:fs` imports above.
