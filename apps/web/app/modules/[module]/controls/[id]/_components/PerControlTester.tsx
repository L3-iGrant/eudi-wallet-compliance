'use client';

/**
 * Per-control tester. Lets the user paste an EAA compact serialisation
 * and run JUST this control's check, without going through the main
 * assessment flow. The result is ephemeral: no IndexedDB save, no
 * report id, no email gate.
 *
 * Phase 1 scope:
 * - Only renders when the control is registered as auto-tested.
 * - Only handles eaa-payload evidence. Controls that need
 *   issuer-cert / status-list / type-metadata fall back to a hint
 *   pointing at the main assessment flow.
 * - Scope is mostly pre-fixed from the control (module, profile,
 *   role); the user only picks a tier from the control's applies_to
 *   list.
 *
 * Last-pasted EAA is persisted to sessionStorage keyed by control id
 * so iterating on a single control across reloads keeps your work.
 */

import { useEffect, useRef, useState } from 'react';
import type { Control } from '@iwc/controls';
import type { AssessmentScope, Verdict } from '@iwc/engine';
import { getCheck } from '@iwc/engine';

const TIER_LABEL: Record<string, string> = {
  'ordinary-eaa': 'Ordinary EAA',
  qeaa: 'QEAA',
  'pub-eaa': 'PuB-EAA',
  all: 'All tiers',
};

const STATUS_BADGE: Record<string, string> = {
  pass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  fail: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  na: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

function tierFromApplies(applies: Control['applies_to']): AssessmentScope['tier'] {
  // applies_to entries map 1:1 to engine tier values, except 'all' which
  // expands to ordinary-eaa as the default starting point.
  const first = applies.find((a) => a !== 'all') ?? 'ordinary-eaa';
  if (first === 'ordinary-eaa') return 'ordinary';
  if (first === 'qeaa') return 'qeaa';
  if (first === 'pub-eaa') return 'pub-eaa';
  return 'ordinary';
}

function tierToCatalogue(t: AssessmentScope['tier']): string {
  if (t === 'ordinary') return 'ordinary-eaa';
  return t;
}

interface PerControlTesterProps {
  control: Control;
}

export function PerControlTester({ control }: PerControlTesterProps) {
  const [eaaPayload, setEaaPayload] = useState('');
  const [tier, setTier] = useState<AssessmentScope['tier']>(() =>
    tierFromApplies(control.applies_to),
  );
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const storageKey = `iwc.tester.eaa.${control.id}`;
  const restored = useRef(false);

  // Restore the last-pasted EAA once on mount so iterating on the same
  // control keeps your input across reloads. Reading sessionStorage during
  // render or in a useState initializer would cause a hydration mismatch
  // (server has no sessionStorage); a post-mount one-shot setState is the
  // legitimate pattern here.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const saved = sessionStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external sessionStorage state into local state on mount
      if (saved) setEaaPayload(saved);
    } catch {
      // sessionStorage may be unavailable (private mode etc.); ignore.
    }
  }, [storageKey]);

  // Persist as the user types, debounced via the natural render cadence.
  useEffect(() => {
    try {
      if (eaaPayload) {
        sessionStorage.setItem(storageKey, eaaPayload);
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      /* ignore */
    }
  }, [eaaPayload, storageKey]);

  const requiresOnlyPayload =
    control.evidence_type.length === 1 &&
    control.evidence_type[0] === 'eaa-payload';

  const tierOptions = control.applies_to
    .filter((a) => a !== 'all')
    .map((a) => ({
      value: a === 'ordinary-eaa'
        ? ('ordinary' as const)
        : (a as 'qeaa' | 'pub-eaa'),
      label: TIER_LABEL[a] ?? a,
    }));

  const runCheck = async () => {
    setError(null);
    setVerdict(null);
    setBusy(true);
    try {
      const trimmed = eaaPayload.trim();
      if (!trimmed) {
        setError('Paste an EAA before running the check.');
        return;
      }
      const check = getCheck(control.id);
      if (!check) {
        setError('No registered check for this control id.');
        return;
      }
      const scope: AssessmentScope = {
        module: control.module,
        profile: control.profile.length > 0 ? control.profile : ['sd-jwt-vc'],
        role: control.role.length > 0 ? control.role : ['issuer'],
        tier,
      };
      const result = await check({ eaaPayload: trimmed }, scope);
      setVerdict(result);
    } catch (err) {
      setError((err as Error).message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  if (!requiresOnlyPayload) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
        This control needs more than just the EAA payload to evaluate
        (evidence types: {control.evidence_type.join(', ')}). Run the full
        Self-Assessment for now and look at this control's verdict in the
        report.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
        Test this control
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
        Paste an SD-JWT VC EAA below and run just this control's check.
        Nothing leaves your browser; the result is not saved.
      </p>

      <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
        EAA compact serialisation
      </label>
      <textarea
        value={eaaPayload}
        onChange={(e) => setEaaPayload(e.target.value)}
        rows={5}
        spellCheck={false}
        placeholder="eyJhbGciOiJFUzI1NiIs...~WyJzYWx0Iiw..."
        className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
      />

      {tierOptions.length > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <label
            htmlFor={`${control.id}-tier`}
            className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500"
          >
            Tier
          </label>
          <select
            id={`${control.id}-tier`}
            value={tier}
            onChange={(e) =>
              setTier(e.target.value as AssessmentScope['tier'])
            }
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 focus:border-blue-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            {tierOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={runCheck}
          disabled={busy || eaaPayload.trim().length === 0}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {busy ? 'Running…' : 'Run check'}
        </button>
        {(eaaPayload || verdict || error) && (
          <button
            type="button"
            onClick={() => {
              setEaaPayload('');
              setVerdict(null);
              setError(null);
            }}
            className="text-xs font-semibold text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      {verdict && (
        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
              STATUS_BADGE[verdict.status] ?? STATUS_BADGE.na
            }`}
          >
            {verdict.status.toUpperCase()}
          </span>
          <span className="ml-3 text-zinc-700 dark:text-zinc-300">
            {verdict.notes || '(no engine notes)'}
          </span>
          {verdict.evidenceRef && (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
              Evaluated against: {verdict.evidenceRef} · scope tier:{' '}
              {TIER_LABEL[tierToCatalogue(tier)] ?? tier}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
