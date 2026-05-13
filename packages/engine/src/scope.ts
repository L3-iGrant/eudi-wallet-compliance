import type { Control } from '@iwc/controls';
import type { AssessmentScope } from './types';

/**
 * The catalogue uses the canonical applies_to value 'ordinary-eaa' for
 * the Ordinary EAA tier; AssessmentScope uses the friendlier 'ordinary'
 * slug. Map between them here.
 */
function tierToAppliesTo(tier: AssessmentScope['tier']): string {
  return tier === 'ordinary' ? 'ordinary-eaa' : tier;
}

/**
 * Filter a control list down to the ones that apply to a given assessment
 * scope. A control is in scope when:
 *   - its `profile` array intersects `scope.profile` (clause-4 cross-
 *     cutting rules declare both concrete profiles, e.g.
 *     `profile: [sd-jwt-vc, mdoc]`, so they fire on any concrete scope)
 *   - its `role` array intersects `scope.role`
 *   - its `applies_to` array contains the mapped tier OR contains 'all'
 */
export function filterControlsForScope(
  controls: Control[],
  scope: AssessmentScope,
): Control[] {
  const tierKey = tierToAppliesTo(scope.tier);
  return controls.filter((c) => {
    const profileMatch = c.profile.some((p) =>
      (scope.profile as string[]).includes(p),
    );
    if (!profileMatch) return false;

    const roleMatch = c.role.some((r) => (scope.role as string[]).includes(r));
    if (!roleMatch) return false;

    const tierMatch =
      c.applies_to.includes(tierKey as Control['applies_to'][number]) ||
      c.applies_to.includes('all');
    if (!tierMatch) return false;

    return true;
  });
}
