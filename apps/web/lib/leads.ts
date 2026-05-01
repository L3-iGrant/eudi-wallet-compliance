import { checkPermission, PermissionError } from './permissions';

/**
 * A captured email address attached to a specific report. Used to gate
 * PDF and JSON downloads so the toolkit can produce a small lead list
 * for the iGrant.io solutions team without bothering casual readers.
 *
 * One lead per `(tenantId, reportId)` pair; re-submitting overwrites
 * the previous capture so the latest email wins.
 */
export interface Lead {
  reportId: string;
  email: string;
  projectId: string | null;
  /** ISO 8601 timestamp at which the lead was captured. */
  capturedAt: string;
}

export interface LeadsStore {
  saveLead(tenantId: string, lead: Lead): Promise<void>;
  getLeadByReportId(tenantId: string, reportId: string): Promise<Lead | null>;
  listLeads(
    tenantId: string,
    filters: { projectId?: string; limit?: number },
  ): Promise<Lead[]>;
}

interface StoreEntry {
  lead: Lead;
  savedAt: number;
}

interface PersistedShape {
  version: 1;
  entries: Array<[string, StoreEntry]>;
}

const LOCAL_STORAGE_KEY = 'iwc:leads:v0';

interface EphemeralLeadsStoreOptions {
  ttlDays: number;
  /** Override for testing. Defaults to Date.now. */
  now?: () => number;
}

/**
 * v0 lead store. Same shape as `EphemeralReportStore` but with a longer
 * default TTL (leads represent intentional opt-ins, not transient
 * working state) and its own localStorage key. Browser-safe; no fs.
 */
export class EphemeralLeadsStore implements LeadsStore {
  private readonly entries = new Map<string, StoreEntry>();
  private readonly ttlMs: number;
  private readonly now: () => number;
  private readonly canPersist: boolean;

  constructor(options: EphemeralLeadsStoreOptions) {
    this.ttlMs = options.ttlDays * 24 * 60 * 60 * 1000;
    this.now = options.now ?? (() => Date.now());
    this.canPersist =
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as { localStorage?: Storage }).localStorage !== 'undefined';
    this.hydrate();
    this.sweep();
  }

  async saveLead(tenantId: string, lead: Lead): Promise<void> {
    this.assertPermitted(tenantId, 'write');
    this.sweep();
    this.entries.set(this.key(tenantId, lead.reportId), {
      lead,
      savedAt: this.now(),
    });
    this.persist();
  }

  async getLeadByReportId(
    tenantId: string,
    reportId: string,
  ): Promise<Lead | null> {
    this.assertPermitted(tenantId, 'read');
    const k = this.key(tenantId, reportId);
    const entry = this.entries.get(k);
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.entries.delete(k);
      this.persist();
      return null;
    }
    return entry.lead;
  }

  async listLeads(
    tenantId: string,
    filters: { projectId?: string; limit?: number },
  ): Promise<Lead[]> {
    this.assertPermitted(tenantId, 'read');
    const prefix = `${tenantId}:`;
    const matches: StoreEntry[] = [];
    for (const [k, entry] of this.entries) {
      if (!k.startsWith(prefix)) continue;
      if (this.isExpired(entry)) continue;
      if (
        filters.projectId !== undefined &&
        entry.lead.projectId !== filters.projectId
      ) {
        continue;
      }
      matches.push(entry);
    }
    matches.sort((a, b) => b.savedAt - a.savedAt);
    const limited =
      filters.limit !== undefined ? matches.slice(0, filters.limit) : matches;
    return limited.map((e) => e.lead);
  }

  private assertPermitted(tenantId: string, action: 'read' | 'write'): void {
    if (!checkPermission(tenantId, null, 'lead', action)) {
      throw new PermissionError(tenantId, 'lead', action);
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

export const leadsStore: LeadsStore = new EphemeralLeadsStore({ ttlDays: 365 });
