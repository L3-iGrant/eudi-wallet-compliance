import type { Control } from '@iwc/controls';
import type { AssessmentScope, Verdict } from './types';

const TIER_TO_APPLIES_TO: Record<AssessmentScope['tier'], string> = {
  ordinary: 'ordinary-eaa',
  qeaa: 'qeaa',
  'pub-eaa': 'pub-eaa',
};

/**
 * Static delta of "controls that become required at a higher tier".
 *
 * For each higher tier than `currentTier`, find every control whose
 * `applies_to` set includes the higher tier but excludes the current
 * tier. From that set, return the IDs whose verdicts do not show
 * `pass` (i.e. the current evidence has not already cleared them).
 *
 * Pure function over the supplied `controls` and `verdicts`. Does no
 * I/O and does not re-run any check; runAssessment's main pass
 * handles tier-aware behaviour separately via `missingForX`.
 *
 * Controls with `applies_to: ['all']` are treated as required at every
 * tier and therefore never appear in the delta (they are not new at
 * the higher tier).
 */
export function computeAdditionallyRequired(
  controls: Control[],
  verdicts: Verdict[],
  currentTier: AssessmentScope['tier'],
): {
  additionallyRequiredForQeaa: string[];
  additionallyRequiredForPubEaa: string[];
} {
  const verdictByControl = new Map<string, Verdict>();
  for (const v of verdicts) verdictByControl.set(v.controlId, v);
  const currentKey = TIER_TO_APPLIES_TO[currentTier];

  function deltaFor(higherTier: AssessmentScope['tier']): string[] {
    const higherKey = TIER_TO_APPLIES_TO[higherTier];
    const out: string[] = [];
    for (const c of controls) {
      const appliesAtHigher = c.applies_to.includes(higherKey as never);
      const appliesAtCurrent = c.applies_to.includes(currentKey as never);
      const appliesToAll = c.applies_to.includes('all' as never);
      if (appliesToAll) continue;
      if (!appliesAtHigher) continue;
      if (appliesAtCurrent) continue;
      const v = verdictByControl.get(c.id);
      if (v && v.status === 'pass') continue;
      out.push(c.id);
    }
    return out;
  }

  if (currentTier === 'ordinary') {
    return {
      additionallyRequiredForQeaa: deltaFor('qeaa'),
      additionallyRequiredForPubEaa: deltaFor('pub-eaa'),
    };
  }
  if (currentTier === 'qeaa') {
    return {
      additionallyRequiredForQeaa: [],
      additionallyRequiredForPubEaa: deltaFor('pub-eaa'),
    };
  }
  return {
    additionallyRequiredForQeaa: [],
    additionallyRequiredForPubEaa: [],
  };
}
