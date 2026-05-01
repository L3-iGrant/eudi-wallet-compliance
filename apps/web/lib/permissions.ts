/**
 * Permission resolver. v0 has no real RBAC: every action against the
 * `public-default` tenant is allowed; everything else is denied.
 *
 * **Resolver swap point for v2.** When the multi-tenant SaaS arrives
 * (Decision 2.2), replace the body of `checkPermission` with the real
 * resolver (look up tenant memberships, role assignments, project ACLs).
 * Every storage call must go through `checkPermission` before reading or
 * writing so the swap is purely internal: no caller has to change.
 */

export type Action = 'read' | 'write' | 'delete';
export type Resource = 'report' | 'project' | 'tenant';

export function checkPermission(
  tenantId: string,
  _userId: string | null,
  _resource: Resource,
  _action: Action,
): boolean {
  if (tenantId === 'public-default') {
    return true;
  }
  return false;
}

export class PermissionError extends Error {
  readonly code = 'PERMISSION_DENIED' as const;
  constructor(
    public readonly tenantId: string,
    public readonly resource: Resource,
    public readonly action: Action,
  ) {
    super(
      `Permission denied: ${action} on ${resource} for tenant "${tenantId}"`,
    );
    this.name = 'PermissionError';
  }
}
