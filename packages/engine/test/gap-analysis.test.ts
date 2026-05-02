import { describe, it, expect } from 'vitest';
import type { Control } from '@iwc/controls';
import { computeAdditionallyRequired } from '../src/gap-analysis';
import type { Verdict } from '../src/types';

function ctrl(
  id: string,
  appliesTo: Control['applies_to'],
  overrides: Partial<Control> = {},
): Control {
  return {
    id,
    module: 'eaa-conformance',
    spec_source: { document: 'ETSI TS 119 472-1', version: 'v1.2.1', clause: '5' },
    modal_verb: 'shall',
    applies_to: appliesTo,
    profile: ['sd-jwt-vc'],
    role: ['issuer'],
    evidence_type: ['eaa-payload'],
    short_title: `Title for ${id}`,
    spec_text: `Spec text for ${id} with enough characters to satisfy schema.`,
    plain_english: 'TODO',
    common_mistakes: [],
    related_controls: [],
    ...overrides,
  };
}

function verdict(controlId: string, status: Verdict['status']): Verdict {
  return { controlId, status, evidenceRef: '', notes: '' };
}

describe('computeAdditionallyRequired', () => {
  it('returns empty arrays when current tier is pub-eaa (top of stack)', () => {
    const controls = [ctrl('A', ['ordinary-eaa', 'qeaa', 'pub-eaa'])];
    const out = computeAdditionallyRequired(controls, [], 'pub-eaa');
    expect(out.additionallyRequiredForQeaa).toEqual([]);
    expect(out.additionallyRequiredForPubEaa).toEqual([]);
  });

  it('flags controls that newly apply at the higher tier and have no pass verdict', () => {
    const controls = [
      ctrl('QEAA-only', ['qeaa']),
      ctrl('Ordinary-and-QEAA', ['ordinary-eaa', 'qeaa']),
    ];
    const out = computeAdditionallyRequired(controls, [], 'ordinary');
    expect(out.additionallyRequiredForQeaa).toEqual(['QEAA-only']);
  });

  it('omits controls that already pass at the current tier', () => {
    const controls = [ctrl('QEAA-only', ['qeaa'])];
    const out = computeAdditionallyRequired(
      controls,
      [verdict('QEAA-only', 'pass')],
      'ordinary',
    );
    expect(out.additionallyRequiredForQeaa).toEqual([]);
  });

  it('treats applies_to: [all] as not-newly-required', () => {
    const controls = [ctrl('AllTiers', ['all'])];
    const out = computeAdditionallyRequired(controls, [], 'ordinary');
    expect(out.additionallyRequiredForQeaa).toEqual([]);
    expect(out.additionallyRequiredForPubEaa).toEqual([]);
  });

  it('separates QEAA-only and PuB-EAA-only deltas from current=ordinary', () => {
    const controls = [
      ctrl('QEAA-required', ['qeaa']),
      ctrl('PubEAA-required', ['pub-eaa']),
      ctrl('QEAA-and-PubEAA', ['qeaa', 'pub-eaa']),
    ];
    const out = computeAdditionallyRequired(controls, [], 'ordinary');
    expect(out.additionallyRequiredForQeaa.sort()).toEqual([
      'QEAA-and-PubEAA',
      'QEAA-required',
    ]);
    expect(out.additionallyRequiredForPubEaa.sort()).toEqual([
      'PubEAA-required',
      'QEAA-and-PubEAA',
    ]);
  });

  it('from current=qeaa, only PuB-EAA delta is non-empty', () => {
    const controls = [
      ctrl('PubEAA-only', ['pub-eaa']),
      ctrl('QEAA-and-Ordinary', ['ordinary-eaa', 'qeaa']),
    ];
    const out = computeAdditionallyRequired(controls, [], 'qeaa');
    expect(out.additionallyRequiredForQeaa).toEqual([]);
    expect(out.additionallyRequiredForPubEaa).toEqual(['PubEAA-only']);
  });

  it('controls with non-pass (fail/warn/na) verdicts still appear in the delta', () => {
    const controls = [
      ctrl('QEAA-required-failed', ['qeaa']),
      ctrl('QEAA-required-warned', ['qeaa']),
      ctrl('QEAA-required-na', ['qeaa']),
    ];
    const out = computeAdditionallyRequired(
      controls,
      [
        verdict('QEAA-required-failed', 'fail'),
        verdict('QEAA-required-warned', 'warn'),
        verdict('QEAA-required-na', 'na'),
      ],
      'ordinary',
    );
    expect(out.additionallyRequiredForQeaa.sort()).toEqual([
      'QEAA-required-failed',
      'QEAA-required-na',
      'QEAA-required-warned',
    ]);
  });
});
