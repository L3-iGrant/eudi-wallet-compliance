import { describe, it, expect } from 'vitest';
import {
  checkPermission,
  PermissionError,
  type Action,
  type Resource,
} from '../permissions';

const RESOURCES: Resource[] = ['report', 'project', 'tenant', 'lead'];
const ACTIONS: Action[] = ['read', 'write', 'delete'];

describe('checkPermission', () => {
  it.each(RESOURCES.flatMap((r) => ACTIONS.map((a) => [r, a] as const)))(
    'public-default tenant is allowed to %s on %s',
    (resource, action) => {
      expect(checkPermission('public-default', null, resource, action)).toBe(true);
    },
  );

  it.each(RESOURCES.flatMap((r) => ACTIONS.map((a) => [r, a] as const)))(
    'non-public tenant is denied to %s on %s',
    (resource, action) => {
      expect(checkPermission('acme', 'user-1', resource, action)).toBe(false);
    },
  );

  it('PermissionError carries the denied tenant, resource, and action', () => {
    const err = new PermissionError('acme', 'report', 'write');
    expect(err.code).toBe('PERMISSION_DENIED');
    expect(err.tenantId).toBe('acme');
    expect(err.resource).toBe('report');
    expect(err.action).toBe('write');
    expect(err.message).toContain('acme');
    expect(err.message).toContain('report');
    expect(err.message).toContain('write');
  });
});
