import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ControlsCatalogueSchema, loadControlsFromFile } from '../src/index';

const here = dirname(fileURLToPath(import.meta.url));
const exampleFile = join(here, '..', 'data', 'eaa-conformance', '_example.yaml');

describe('controls catalogue schema', () => {
  it('loads and validates the bundled example YAML', async () => {
    const controls = await loadControlsFromFile(exampleFile);
    expect(Array.isArray(controls)).toBe(true);
    expect(controls.length).toBeGreaterThan(0);
    expect(controls[0]?.id).toBe('EAA-5.2.1.2-01');
  });

  it('rejects YAML missing required fields', () => {
    const invalidYaml = `
- id: EAA-5.2.1.2-99
  module: eaa-conformance
`;
    const data = parseYaml(invalidYaml);
    const result = ControlsCatalogueSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects an id that does not match the pattern', () => {
    const invalid = [
      {
        id: 'lowercase-id-01',
        module: 'eaa-conformance',
        spec_source: { document: 'X', version: '1', clause: '1' },
        requirement_level: 'shall',
        profile: ['abstract'],
        role: ['issuer'],
        evidence_type: ['eaa-payload'],
        short_title: 'A short title',
        spec_text: 'Spec text long enough.',
        plain_english: 'Plain English long enough to satisfy the minimum length.',
      },
    ];
    const result = ControlsCatalogueSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
