import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ControlsCatalogueSchema, type ControlsCatalogue } from './schema';

export async function loadControlsFromFile(filePath: string): Promise<ControlsCatalogue> {
  const raw = await readFile(filePath, 'utf8');
  const parsed = parseYaml(raw);
  return ControlsCatalogueSchema.parse(parsed);
}

export async function loadAllControls(dataDir: string): Promise<ControlsCatalogue> {
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

export * from './schema';
