import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { EphemeralLeadsStore, type Lead } from '../leads';
import { PermissionError } from '../permissions';

function makeLead(reportId: string, email = 'test@example.com'): Lead {
  return {
    reportId,
    email,
    projectId: null,
    capturedAt: new Date(0).toISOString(),
  };
}

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

afterEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

describe('EphemeralLeadsStore', () => {
  it('saves and retrieves a lead by reportId', async () => {
    const store = new EphemeralLeadsStore({ ttlDays: 365 });
    const lead = makeLead('r-1', 'eve@example.com');
    await store.saveLead('public-default', lead);
    const fetched = await store.getLeadByReportId('public-default', 'r-1');
    expect(fetched?.email).toBe('eve@example.com');
  });

  it('returns null for an unknown reportId', async () => {
    const store = new EphemeralLeadsStore({ ttlDays: 365 });
    expect(await store.getLeadByReportId('public-default', 'unknown')).toBeNull();
  });

  it('overwrites a previous capture for the same reportId', async () => {
    const store = new EphemeralLeadsStore({ ttlDays: 365 });
    await store.saveLead('public-default', makeLead('r-1', 'first@example.com'));
    await store.saveLead('public-default', makeLead('r-1', 'second@example.com'));
    const fetched = await store.getLeadByReportId('public-default', 'r-1');
    expect(fetched?.email).toBe('second@example.com');
  });

  it('lists leads filtered by projectId, newest first', async () => {
    let now = 1_000_000;
    const store = new EphemeralLeadsStore({ ttlDays: 365, now: () => now });
    await store.saveLead('public-default', { ...makeLead('r-1'), projectId: 'p-a' });
    now += 1000;
    await store.saveLead('public-default', { ...makeLead('r-2'), projectId: 'p-b' });
    now += 1000;
    await store.saveLead('public-default', { ...makeLead('r-3'), projectId: 'p-a' });

    const all = await store.listLeads('public-default', {});
    expect(all.map((l) => l.reportId)).toEqual(['r-3', 'r-2', 'r-1']);

    const onlyA = await store.listLeads('public-default', { projectId: 'p-a' });
    expect(onlyA.map((l) => l.reportId)).toEqual(['r-3', 'r-1']);
  });

  it('evicts entries past the TTL on read', async () => {
    let now = 0;
    const store = new EphemeralLeadsStore({ ttlDays: 30, now: () => now });
    await store.saveLead('public-default', makeLead('r-old'));
    now = 31 * 24 * 60 * 60 * 1000;
    expect(await store.getLeadByReportId('public-default', 'r-old')).toBeNull();
  });

  it('rejects writes from a non-public tenant with PermissionError', async () => {
    const store = new EphemeralLeadsStore({ ttlDays: 365 });
    await expect(
      store.saveLead('acme', makeLead('r-1')),
    ).rejects.toBeInstanceOf(PermissionError);
  });

  it('rejects reads from a non-public tenant with PermissionError', async () => {
    const store = new EphemeralLeadsStore({ ttlDays: 365 });
    await expect(
      store.getLeadByReportId('acme', 'r-1'),
    ).rejects.toBeInstanceOf(PermissionError);
    await expect(store.listLeads('acme', {})).rejects.toBeInstanceOf(
      PermissionError,
    );
  });

  it('persists to localStorage and rehydrates across instances', async () => {
    const a = new EphemeralLeadsStore({ ttlDays: 365 });
    await a.saveLead('public-default', makeLead('r-persist', 'p@example.com'));
    const b = new EphemeralLeadsStore({ ttlDays: 365 });
    const fetched = await b.getLeadByReportId('public-default', 'r-persist');
    expect(fetched?.email).toBe('p@example.com');
  });
});
