import { describe, it, expect } from 'vitest';
import { controlIdToSlug, slugToControlId } from '../src/index';

const sampleCatalogue = [
  { id: 'EAA-5.2.10.1-04' },
  { id: 'EAA-5.1-01' },
  { id: 'QEAA-5.6.2-01' },
  { id: 'PuB-EAA-5.6.3-02' },
];

describe('controlIdToSlug', () => {
  it('lowercases the prefix and replaces dots with dashes for an EAA id', () => {
    expect(controlIdToSlug('EAA-5.2.10.1-04')).toBe('eaa-5-2-10-1-04');
  });

  it('handles a QEAA prefix', () => {
    expect(controlIdToSlug('QEAA-5.6.2-01')).toBe('qeaa-5-6-2-01');
  });

  it('handles a mixed-case PuB-EAA prefix', () => {
    expect(controlIdToSlug('PuB-EAA-5.6.3-02')).toBe('pub-eaa-5-6-3-02');
  });

  it('handles ids with no trailing -NN suffix', () => {
    expect(controlIdToSlug('EAA-5.1-01')).toBe('eaa-5-1-01');
  });
});

describe('slugToControlId', () => {
  it('round-trips for each prefix family', () => {
    for (const c of sampleCatalogue) {
      const slug = controlIdToSlug(c.id);
      expect(slugToControlId(slug, sampleCatalogue)).toBe(c.id);
    }
  });

  it('preserves canonical casing of mixed-case prefixes (PuB)', () => {
    expect(slugToControlId('pub-eaa-5-6-3-02', sampleCatalogue)).toBe(
      'PuB-EAA-5.6.3-02',
    );
  });

  it('returns null for a slug that does not match any control', () => {
    expect(slugToControlId('eaa-9-9-9-99', sampleCatalogue)).toBeNull();
  });

  it('returns null for an empty catalogue', () => {
    expect(slugToControlId('eaa-5-2-10-1-04', [])).toBeNull();
  });
});
