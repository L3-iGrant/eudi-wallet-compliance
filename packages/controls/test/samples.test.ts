import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import { z } from 'zod';
import { loadAllControls } from '../src/index';

const here = dirname(fileURLToPath(import.meta.url));
const samplesDir = join(here, '..', 'data', 'reference-samples');
const dataDir = join(here, '..', 'data');

const SampleSchema = z.object({
  sample_id: z.string().min(1),
  title: z.string().min(5),
  description: z.string().min(20),
  profile: z.enum(['sd-jwt-vc', 'mdoc', 'abstract']),
  tier: z.enum(['ordinary-eaa', 'qeaa', 'pub-eaa']),
  compact_serialisation: z.string().min(1),
  decoded_header: z.record(z.string(), z.unknown()),
  decoded_payload: z.record(z.string(), z.unknown()),
  issuer_cert_pem: z.string().regex(/-----BEGIN CERTIFICATE-----/),
  exercises_controls: z.array(z.string()).min(1),
  generated_by: z.string().min(1),
  generated_at: z.string().regex(/\d{4}-\d{2}-\d{2}T/),
});

async function listSampleFiles(): Promise<string[]> {
  const entries = await readdir(samplesDir);
  return entries.filter((f) => f.endsWith('.json'));
}

describe('reference samples', () => {
  it('every sample JSON file matches the expected shape', async () => {
    const files = await listSampleFiles();
    expect(files.length).toBeGreaterThanOrEqual(1);
    for (const file of files) {
      const raw = await readFile(join(samplesDir, file), 'utf8');
      const data = JSON.parse(raw);
      const result = SampleSchema.safeParse(data);
      if (!result.success) {
        throw new Error(
          `Sample ${file} failed schema: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
    }
  });

  it('every exercises_controls id resolves to a real control in the catalogue', async () => {
    const controls = await loadAllControls(dataDir);
    const ids = new Set(controls.map((c) => c.id));

    const files = await listSampleFiles();
    const orphaned: string[] = [];
    for (const file of files) {
      const raw = await readFile(join(samplesDir, file), 'utf8');
      const data = SampleSchema.parse(JSON.parse(raw));
      for (const cid of data.exercises_controls) {
        if (!ids.has(cid)) orphaned.push(`${file}:${cid}`);
      }
    }
    expect(orphaned).toEqual([]);
  });

  it('sample_id matches the filename basename', async () => {
    const files = await listSampleFiles();
    for (const file of files) {
      const raw = await readFile(join(samplesDir, file), 'utf8');
      const data = SampleSchema.parse(JSON.parse(raw));
      expect(file).toBe(`${data.sample_id}.json`);
    }
  });
});
