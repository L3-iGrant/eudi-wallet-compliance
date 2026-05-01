import { describe, it, expect } from 'vitest';
import { loadModules } from '../src/index';

describe('module metadata', () => {
  it('loads 7 modules from the bundled data/modules.yaml', async () => {
    const modules = await loadModules();
    expect(modules).toHaveLength(7);
  });

  it('contains exactly one shipped module, eaa-conformance', async () => {
    const modules = await loadModules();
    const shipped = modules.filter((m) => m.status === 'shipped');
    expect(shipped).toHaveLength(1);
    expect(shipped[0]?.id).toBe('eaa-conformance');
  });

  it('every module has at least one spec_source', async () => {
    const modules = await loadModules();
    for (const m of modules) {
      expect(m.spec_sources.length, `module ${m.id} has no spec_sources`).toBeGreaterThan(0);
    }
  });
});
