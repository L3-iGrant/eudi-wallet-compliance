/**
 * Tenant resolver. v0 always returns the public tenant id; the static
 * export has no auth or routing layer to derive a real tenant from. In
 * v2 this becomes the place to inspect the request (auth token,
 * subdomain, path prefix) and return the caller's actual tenant id.
 */

export const PUBLIC_TENANT_ID = 'public-default';

export function resolveTenant(): string;
export function resolveTenant(request: Request): string;
export function resolveTenant(_request?: Request): string {
  return PUBLIC_TENANT_ID;
}
