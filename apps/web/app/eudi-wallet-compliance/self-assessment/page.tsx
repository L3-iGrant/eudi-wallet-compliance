'use client';

import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { loadModulesSync } from '@iwc/controls/sync';
import type { ModuleMetadata } from '@iwc/controls';

const ScopeSchema = z.object({
  module: z.literal('eaa-conformance'),
  role: z
    .array(z.enum(['issuer', 'verifier']))
    .min(1, { message: 'Pick at least one role.' }),
  profile: z
    .array(z.enum(['sd-jwt-vc', 'mdoc']))
    .min(1, { message: 'Pick at least one profile.' }),
  tier: z.enum(['ordinary', 'qeaa', 'pub-eaa']),
});

type ScopeForm = z.infer<typeof ScopeSchema>;

const STATUS_LABEL: Record<string, string> = {
  shipped: 'Live',
  'in-development': 'In development',
  planned: 'Planned',
};

export default function ScopePicker() {
  const router = useRouter();
  const allModules = loadModulesSync();
  const otherModules = allModules.filter((m) => m.id !== 'eaa-conformance');
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ScopeForm>({
    resolver: zodResolver(ScopeSchema),
    defaultValues: {
      module: 'eaa-conformance',
      role: ['issuer'],
      profile: ['sd-jwt-vc'],
      tier: 'ordinary',
    },
  });

  const onSubmit = (data: ScopeForm) => {
    const params = new URLSearchParams();
    params.set('module', data.module);
    for (const r of data.role) params.append('role', r);
    for (const p of data.profile) params.append('profile', p);
    params.set('tier', data.tier);
    router.push(`/eudi-wallet-compliance/self-assessment/upload/?${params.toString()}`);
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
        Self-Assessment · Step 1 of 2
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        EUDI Wallet Compliance Self-Assessment
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        Pick what you want to assess. The free tool runs locally; reports are kept for 30 days.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-8">
        <Fieldset legend="Module">
          <Controller
            name="module"
            control={control}
            render={({ field }) => (
              <ModuleSelect
                value={field.value}
                onChange={field.onChange}
                modules={allModules}
              />
            )}
          />
        </Fieldset>

        <Fieldset legend="Role" error={errors.role?.message}>
          <CheckboxRow
            label="Issuer"
            value="issuer"
            {...register('role')}
          />
          <CheckboxRow
            label="Verifier"
            value="verifier"
            {...register('role')}
          />
        </Fieldset>

        <Fieldset legend="Profile" error={errors.profile?.message}>
          <CheckboxRow
            label="SD-JWT VC"
            value="sd-jwt-vc"
            {...register('profile')}
          />
          <CheckboxRow
            label="ISO mdoc"
            value="mdoc"
            {...register('profile')}
          />
        </Fieldset>

        <Fieldset legend="Tier">
          <SelectField {...register('tier')} ariaLabel="Tier">
            <option value="ordinary">Ordinary EAA</option>
            <option value="qeaa">QEAA</option>
            <option value="pub-eaa">PuB-EAA</option>
          </SelectField>
        </Fieldset>

        <div className="flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-700 hover:text-blue-700 hover:underline dark:text-zinc-300 dark:hover:text-blue-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-zinc-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Continue
          </button>
        </div>
      </form>
    </article>
  );
}

function Fieldset({
  legend,
  error,
  children,
}: {
  legend: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-zinc-950 dark:text-white">
        {legend}
      </legend>
      <div className="mt-3 space-y-2">{children}</div>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
      )}
    </fieldset>
  );
}

/**
 * Custom listbox for Module selection. Native <option> cannot show
 * smaller secondary text or coloured indicators inline, so we build a
 * keyboard-and-click-accessible button + popup that mirrors the
 * SelectField look. Wraps each item with the module name (sm), spec
 * citation (xs muted), and a Live or Planned status pill.
 */
interface ModuleSelectProps {
  value: string;
  onChange: (value: string) => void;
  modules: ModuleMetadata[];
}

function ModuleSelect({ value, onChange, modules }: ModuleSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selected = modules.find((m) => m.id === value);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Module"
        className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-3 pr-10 text-left text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      >
        {selected ? (
          <ModuleRow module={selected} />
        ) : (
          <span className="text-zinc-500">Choose a module</span>
        )}
      </button>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {modules.map((m) => {
            const isShipped = m.status === 'shipped';
            const isSelected = m.id === value;
            return (
              <li key={m.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={!isShipped}
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left transition ${
                    !isShipped
                      ? 'cursor-not-allowed opacity-60'
                      : isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/30'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <ModuleRow module={m} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ModuleRow({ module: m }: { module: ModuleMetadata }) {
  const isShipped = m.status === 'shipped';
  return (
    <span className="block">
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-950 dark:text-white">
          {m.name}
        </span>
        {isShipped ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
            />
            Live
          </span>
        ) : (
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {STATUS_LABEL[m.status] ?? 'Planned'}
          </span>
        )}
      </span>
      <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-500">
        {m.spec_sources.join(' · ')}
      </span>
    </span>
  );
}

const CheckboxRow = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm has-checked:border-blue-300 has-checked:bg-blue-50/40 dark:border-zinc-800 dark:bg-zinc-950 dark:has-checked:border-blue-700 dark:has-checked:bg-blue-950/30">
    <input type="checkbox" className="h-4 w-4" {...props} />
    <span className="text-zinc-950 dark:text-white">{label}</span>
  </label>
);

interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'aria-label'> {
  ariaLabel: string;
  children: React.ReactNode;
}

/**
 * Native <select> with our own chevron-down icon. The browser's default
 * arrow rendering varies wildly across platforms; using
 * appearance-none + an explicit icon keeps the field consistent with
 * the rest of the form's bordered inputs.
 */
const SelectField = ({ ariaLabel, children, className, ...props }: SelectFieldProps) => (
  <div className="relative">
    <select
      aria-label={ariaLabel}
      {...props}
      className={`block w-full appearance-none rounded-md border border-zinc-300 bg-white py-2.5 pl-3 pr-10 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark] ${className ?? ''}`}
    >
      {children}
    </select>
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  </div>
);
