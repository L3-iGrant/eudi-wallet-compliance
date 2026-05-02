/**
 * Definitions for the RFC 2119 / ISO Directives Part 2 verbal forms.
 *
 * These are the definitions ETSI follows in its drafting rules (EDR §3.4
 * adopts ISO/IEC Directives Part 2 Annex E verbatim) and that IETF SD-JWT,
 * OpenID, and OAuth specs all reference via RFC 2119 (updated by RFC 8174).
 *
 * Used in `title=` tooltips on every shall/should/may surface in the UI so
 * a reader can hover any one of them and read what the keyword binds.
 */

import type { RequirementLevel } from '@iwc/controls';

export const REQUIREMENT_LEVEL_DEFINITION: Record<RequirementLevel, string> = {
  shall:
    'SHALL — strict requirement. Implementations must follow it to be conformant; no deviation is permitted (RFC 2119, ISO/IEC Directives Part 2).',
  should:
    'SHOULD — recommendation. There may be valid reasons in particular circumstances to deviate, but the full implications must be understood and carefully weighed before doing so (RFC 2119, ISO/IEC Directives Part 2).',
  may:
    'MAY — permission. Truly optional. An implementation may include the behaviour or omit it; vendors choose freely within the limits of the spec (RFC 2119, ISO/IEC Directives Part 2).',
};

export function requirementLevelTooltip(level: RequirementLevel): string {
  return REQUIREMENT_LEVEL_DEFINITION[level];
}
