import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadAllControls } from '../src/index';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'data');

describe('canonical controls catalogue', () => {
  it('loads at least 50 controls from data/', async () => {
    const controls = await loadAllControls(dataDir);
    expect(controls.length).toBeGreaterThanOrEqual(50);
  });

  it('includes at least 5 controls applicable to QEAA', async () => {
    const controls = await loadAllControls(dataDir);
    const qeaa = controls.filter((c) => c.applies_to.includes('qeaa'));
    expect(qeaa.length).toBeGreaterThanOrEqual(5);
  });

  it('skips files whose basename starts with an underscore', async () => {
    const controls = await loadAllControls(dataDir);
    // Drafts use the EAA-4.* clause prefix; if any 4.* control with a clause
    // outside the four cross-cutting picks is loaded, drafts leaked through.
    const allowedSection4Clauses = new Set([
      '4.2.1.2',
      '4.2.1.3',
      '4.2.1.4',
      '4.2.2',
      '4.2.2.2',
      '4.2.2.3',
      '4.2.3',
      '4.2.4.1',
      '4.2.4.2',
      '4.2.4.3',
      '4.2.5',
      '4.2.6.2',
      '4.2.6.3',
      '4.2.6.4',
      '4.2.6.5',
      '4.2.6.6',
      '4.2.6.7',
      '4.2.6.8',
      '4.2.11.1',
    ]);
    const stray = controls.filter(
      (c) =>
        c.spec_source.clause.startsWith('4.') &&
        !allowedSection4Clauses.has(c.spec_source.clause),
    );
    expect(stray).toEqual([]);
  });
});
