/**
 * Render coverage for the reference samples library: index grid and
 * per-sample detail page.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import ReferenceSamplesIndex from '@/app/eudi-wallet-compliance/reference-samples/page';
import SampleDetail from '@/app/eudi-wallet-compliance/reference-samples/samples/[id]/page';
import { loadAllSamplesSync } from '@iwc/controls/sync';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Reference Samples index', () => {
  it('renders a card for every sample in the bundle', () => {
    render(<ReferenceSamplesIndex />);
    const samples = loadAllSamplesSync();
    expect(samples.length).toBeGreaterThan(0);
    for (const s of samples) {
      // The sample id is rendered as an upper-cased badge on the card.
      const matches = screen.getAllByText(s.sample_id.toUpperCase());
      expect(matches.length).toBeGreaterThan(0);
    }
  });
});

describe('Reference Sample detail page', () => {
  it('renders a known sample id with its compact form and copy button', async () => {
    const sample = loadAllSamplesSync().find(
      (s) => s.sample_id === 'sjv-eaa-1',
    );
    expect(sample).toBeTruthy();
    const ui = await SampleDetail({
      params: Promise.resolve({ id: 'sjv-eaa-1' }),
    });
    render(ui);
    expect(screen.getByText(sample!.title)).toBeInTheDocument();
    expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    // Compact serialisation is rendered in a <pre>; check the prefix is present.
    const compactPrefix = sample!.compact_serialisation.slice(0, 30);
    const pres = screen.getAllByText(
      (_, node) => node?.textContent?.startsWith(compactPrefix) ?? false,
    );
    expect(pres.length).toBeGreaterThan(0);
  });

  it('throws notFound for an unknown sample id', async () => {
    await expect(
      SampleDetail({ params: Promise.resolve({ id: 'nope' }) }),
    ).rejects.toThrow(/NEXT_NOT_FOUND/);
  });
});
