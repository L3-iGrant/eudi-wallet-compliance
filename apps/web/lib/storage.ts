import type { AssessmentResult } from '@iwc/engine';
import { checkPermission, PermissionError } from './permissions';

/**
 * Report store abstraction. v0 is in-memory with optional browser
 * localStorage persistence; v2 swaps in a real backend (Postgres or
 * similar) without changing any caller. Every method goes through
 * `checkPermission` first so the same call sites work when RBAC arrives.
 */
export interface ReportStore {
  saveReport(
    tenantId: string,
    projectId: string | null,
    report: AssessmentResult,
  ): Promise<void>;
  getReport(tenantId: string, reportId: string): Promise<AssessmentResult | null>;
  listReports(
    tenantId: string,
    filters: { projectId?: string; limit?: number },
  ): Promise<AssessmentResult[]>;
  deleteReport(tenantId: string, reportId: string): Promise<void>;
}

interface StoreEntry {
  report: AssessmentResult;
  projectId: string | null;
  savedAt: number;
}

interface PersistedShape {
  version: 1;
  entries: Array<[string, StoreEntry]>;
}

const LOCAL_STORAGE_KEY = 'iwc:reports:v0';

interface EphemeralReportStoreOptions {
  ttlDays: number;
  /** Override for testing. Defaults to Date.now. */
  now?: () => number;
}

/**
 * v0 store. Holds reports in a Map keyed by `${tenantId}:${reportId}`,
 * with browser localStorage as a write-through backing so reports
 * survive a page refresh. In Node (build, tests) localStorage is
 * unavailable and the store is purely in-memory.
 *
 * Sweep behaviour: on construction and on every write, evict any entry
 * whose `savedAt` is older than `ttlDays`. Reads inline-check expiry so
 * stale entries cannot be returned even between sweeps.
 */
export class EphemeralReportStore implements ReportStore {
  private readonly entries = new Map<string, StoreEntry>();
  private readonly ttlMs: number;
  private readonly now: () => number;
  private readonly canPersist: boolean;

  constructor(options: EphemeralReportStoreOptions) {
    this.ttlMs = options.ttlDays * 24 * 60 * 60 * 1000;
    this.now = options.now ?? (() => Date.now());
    this.canPersist =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as { localStorage?: Storage }).localStorage !== 'undefined';
    this.hydrate();
    this.sweep();
  }

  async saveReport(
    tenantId: string,
    projectId: string | null,
    report: AssessmentResult,
  ): Promise<void> {
    this.assertPermitted(tenantId, 'report', 'write');
    this.sweep();
    this.entries.set(this.key(tenantId, report.reportId), {
      report,
      projectId,
      savedAt: this.now(),
    });
    this.persist();
  }

  async getReport(
    tenantId: string,
    reportId: string,
  ): Promise<AssessmentResult | null> {
    this.assertPermitted(tenantId, 'report', 'read');
    const k = this.key(tenantId, reportId);
    const entry = this.entries.get(k);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.entries.delete(k);
      this.persist();
      return null;
    }
    return entry.report;
  }

  async listReports(
    tenantId: string,
    filters: { projectId?: string; limit?: number },
  ): Promise<AssessmentResult[]> {
    this.assertPermitted(tenantId, 'report', 'read');
    const prefix = `${tenantId}:`;
    const matches: StoreEntry[] = [];
    for (const [k, entry] of this.entries) {
      if (!k.startsWith(prefix)) continue;
      if (this.isExpired(entry)) continue;
      if (filters.projectId !== undefined && entry.projectId !== filters.projectId) {
        continue;
      }
      matches.push(entry);
    }
    matches.sort((a, b) => b.savedAt - a.savedAt);
    const limited =
      filters.limit !== undefined ? matches.slice(0, filters.limit) : matches;
    return limited.map((e) => e.report);
  }

  async deleteReport(tenantId: string, reportId: string): Promise<void> {
    this.assertPermitted(tenantId, 'report', 'delete');
    this.entries.delete(this.key(tenantId, reportId));
    this.persist();
  }

  private assertPermitted(
    tenantId: string,
    resource: 'report',
    action: 'read' | 'write' | 'delete',
  ): void {
    if (!checkPermission(tenantId, null, resource, action)) {
      throw new PermissionError(tenantId, resource, action);
    }
  }

  private key(tenantId: string, reportId: string): string {
    return `${tenantId}:${reportId}`;
  }

  private isExpired(entry: StoreEntry): boolean {
    return this.now() - entry.savedAt > this.ttlMs;
  }

  private sweep(): void {
    let mutated = false;
    for (const [k, entry] of this.entries) {
      if (this.isExpired(entry)) {
        this.entries.delete(k);
        mutated = true;
      }
    }
    if (mutated) this.persist();
  }

  private hydrate(): void {
    if (!this.canPersist) return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedShape;
      if (parsed?.version !== 1 || !Array.isArray(parsed.entries)) return;
      for (const [k, entry] of parsed.entries) {
        this.entries.set(k, entry);
      }
    } catch {
      // Corrupt or unreadable storage; start fresh.
    }
  }

  private persist(): void {
    if (!this.canPersist) return;
    try {
      const shape: PersistedShape = {
        version: 1,
        entries: Array.from(this.entries.entries()),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(shape));
    } catch {
      // Quota exceeded or storage disabled; keep in-memory state only.
    }
  }
}

export const reportStore: ReportStore = new EphemeralReportStore({ ttlDays: 30 });
