import { runAssessment } from '@iwc/engine';
import type { AssessmentScope, Evidence } from '@iwc/engine';
import { loadAllControlsSync } from '@iwc/controls/sync';
import { reportStore } from '../../lib/storage';
import { resolveTenant } from '../../lib/tenant';

/**
 * Client-side runner for the Self-Assessment.
 *
 * Note: in this codebase the static export precludes Server Actions
 * (`output: 'export'` has no server runtime). The function is therefore
 * a plain async client-side action. The contract matches what a Server
 * Action would expose (scope + evidence in, report id out) so the call
 * site is unchanged the day a server runtime joins the picture.
 */
export async function runAssessmentAction(
  scope: AssessmentScope,
  evidence: Evidence,
): Promise<{ reportId: string }> {
  const tenantId = resolveTenant();
  const controls = loadAllControlsSync();
  const result = await runAssessment(controls, evidence, scope, { tenantId });
  await reportStore.saveReport(tenantId, null, result);
  return { reportId: result.reportId };
}
