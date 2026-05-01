import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import type { AssessmentResult } from '@iwc/engine';
import { EphemeralReportStore } from '../storage';
import { PermissionError } from '../permissions';

function makeReport(reportId: string, tenantId = 'public-default'): AssessmentResult {
  return {
    reportId,
    tenantId,
    scope: {
      module: 'eaa-conformance',
      profile: ['sd-jwt-vc'],
      role: ['issuer'],
      tier: 'ordinary',
    },
    evidenceRefs: [],
    verdicts: [],
    summary: { pass: 0, fail: 0, warn: 0, na: 0 },
    gapAnalysis: {
      canBeQeaa: false,
      missingForQeaa: [],
      canBePubEaa: false,
      missingForPubEaa: [],
    },
    createdAt: new Date(0).toISOString(),
  };
}

beforeEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

afterEach(() => {
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

describe('EphemeralReportStore', () => {
  it('saves and retrieves a report under the public tenant', async () => {
    const store = new EphemeralReportStore({ ttlDays: 30 });
    const report = makeReport('r-1');
    await store.saveReport('public-default', null, report);
    const fetched = await store.getReport('public-default', 'r-1');
    expect(fetched?.reportId).toBe('r-1');
  });

  it('returns null for an unknown report id', async () => {
    const store = new EphemeralReportStore({ ttlDays: 30 });
    expect(await store.getReport('public-default', 'unknown')).toBeNull();
  });

  it('lists reports filtered by projectId and limit, newest first', async () => {
    let now = 1_000_000;
    const store = new EphemeralReportStore({ ttlDays: 30, now: () => now });
    await store.saveReport('public-default', 'proj-a', makeReport('r-1'));
    now += 1000;
    await store.saveReport('public-default', 'proj-b', makeReport('r-2'));
    now += 1000;
    await store.saveReport('public-default', 'proj-a', makeReport('r-3'));

    const all = await store.listReports('public-default', {});
    expect(all.map((r) => r.reportId)).toEqual(['r-3', 'r-2', 'r-1']);

    const onlyA = await store.listReports('public-default', { projectId: 'proj-a' });
    expect(onlyA.map((r) => r.reportId)).toEqual(['r-3', 'r-1']);

    const oneOfEach = await store.listReports('public-default', { limit: 2 });
    expect(oneOfEach.map((r) => r.reportId)).toEqual(['r-3', 'r-2']);
  });

  it('evicts entries past the TTL and surfaces them as null on read', async () => {
    let now = 0;
    const store = new EphemeralReportStore({ ttlDays: 30, now: () => now });
    await store.saveReport('public-default', null, makeReport('r-old'));

    now = 31 * 24 * 60 * 60 * 1000; // 31 days later
    expect(await store.getReport('public-default', 'r-old')).toBeNull();

    // After expiry, save another to confirm sweep purges the old one.
    await store.saveReport('public-default', null, makeReport('r-new'));
    const all = await store.listReports('public-default', {});
    expect(all.map((r) => r.reportId)).toEqual(['r-new']);
  });

  it('deletes a saved report', async () => {
    const store = new EphemeralReportStore({ ttlDays: 30 });
    await store.saveReport('public-default', null, makeReport('r-1'));
    await store.deleteReport('public-default', 'r-1');
    expect(await store.getReport('public-default', 'r-1')).toBeNull();
  });

  it('rejects writes from a non-public tenant with PermissionError', async () => {
    const store = new EphemeralReportStore({ ttlDays: 30 });
    await expect(
      store.saveReport('acme', null, makeReport('r-1', 'acme')),
    ).rejects.toBeInstanceOf(PermissionError);
  });

  it('rejects reads from a non-public tenant with PermissionError', async () => {
    const store = new EphemeralReportStore({ ttlDays: 30 });
    await expect(store.getReport('acme', 'r-1')).rejects.toBeInstanceOf(
      PermissionError,
    );
    await expect(store.listReports('acme', {})).rejects.toBeInstanceOf(
      PermissionError,
    );
  });

  it('rejects deletes from a non-public tenant with PermissionError', async () => {
    const store = new EphemeralReportStore({ ttlDays: 30 });
    await expect(store.deleteReport('acme', 'r-1')).rejects.toBeInstanceOf(
      PermissionError,
    );
  });

  it('persists to localStorage and rehydrates across instances', async () => {
    const a = new EphemeralReportStore({ ttlDays: 30 });
    await a.saveReport('public-default', null, makeReport('r-persist'));
    const b = new EphemeralReportStore({ ttlDays: 30 });
    const fetched = await b.getReport('public-default', 'r-persist');
    expect(fetched?.reportId).toBe('r-persist');
  });
});
