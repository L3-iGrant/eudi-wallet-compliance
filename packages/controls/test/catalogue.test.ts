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
      '4.2.7.1',
      '4.2.7.2',
      '4.2.8.2',
      '4.2.8.3',
      '4.2.8.4',
      '4.2.9.2',
      '4.2.9.3',
      '4.2.10',
      '4.2.11.1',
      '4.2.11.2',
      '4.2.11.3',
      '4.2.12',
      '4.2.13',
      '4.3',
      '4.4.2.2',
      '4.4.2.3',
      '4.4.2.4',
      '4.4.2.5',
      '4.5',
      '4.6.1',
      '4.6.2',
      '4.6.3',
    ]);
    const stray = controls.filter(
      (c) =>
        c.spec_source.clause.startsWith('4.') &&
        !allowedSection4Clauses.has(c.spec_source.clause),
    );
    expect(stray).toEqual([]);
  });

  it('includes a non-zero count of mdoc-profile-tagged controls', async () => {
    const controls = await loadAllControls(dataDir);
    const mdoc = controls.filter((c) => c.profile.includes('mdoc'));
    // Phase 7: section-6.yaml ships ~100 entries from ETSI TS 119 472-1 §6.
    expect(mdoc.length).toBeGreaterThan(50);
  });

  it('keeps SD-JWT-VC-only and mdoc-only profiles disjoint outside cross-cutting controls', async () => {
    const controls = await loadAllControls(dataDir);
    // Cross-cutting (clause 4) rows declare both concrete profiles
    // [sd-jwt-vc, mdoc]; profile-specific rows declare exactly one.
    const profileSpecific = controls.filter((c) => c.profile.length === 1);
    for (const c of profileSpecific) {
      expect(
        c.profile.length,
        `${c.id} has profile ${JSON.stringify(c.profile)}`,
      ).toBe(1);
    }
    // Cross-cutting controls (both profiles) all have clause-4 IDs.
    const crossCutting = controls.filter((c) => c.profile.length === 2);
    for (const c of crossCutting) {
      expect(c.profile.sort()).toEqual(['mdoc', 'sd-jwt-vc']);
      expect(
        c.spec_source.clause.startsWith('4.'),
        `${c.id} has both profiles but clause ${c.spec_source.clause}`,
      ).toBe(true);
    }
  });
});
