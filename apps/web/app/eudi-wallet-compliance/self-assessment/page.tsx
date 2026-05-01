'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { loadModulesSync } from '@iwc/controls/sync';

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
  shipped: 'Available',
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
        Self-Assessment
      </p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
        EUDI Wallet Compliance Self-Assessment
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
        Pick what you want to assess. The free tool runs locally; reports are kept for 30 days.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-8">
        <Fieldset legend="Module">
          <label className="flex items-center gap-3 rounded-md border border-blue-300 bg-blue-50/40 p-3 text-sm dark:border-blue-700 dark:bg-blue-950/30">
            <input
              type="radio"
              value="eaa-conformance"
              defaultChecked
              {...register('module')}
              className="h-4 w-4"
            />
            <span className="font-medium text-zinc-950 dark:text-white">EAA Conformance</span>
            <span className="ml-auto text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Available
            </span>
          </label>
          {otherModules.map((m) => (
            <label
              key={m.id}
              className="flex cursor-not-allowed items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm opacity-60 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <input type="radio" disabled className="h-4 w-4" />
              <span className="text-zinc-700 dark:text-zinc-300">{m.name}</span>
              <span className="ml-auto text-xs font-medium uppercase tracking-wider text-zinc-500">
                {STATUS_LABEL[m.status] ?? 'Planned'}
              </span>
            </label>
          ))}
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
          <RadioRow label="Ordinary EAA" value="ordinary" {...register('tier')} />
          <RadioRow label="QEAA" value="qeaa" {...register('tier')} />
          <RadioRow label="PuB-EAA" value="pub-eaa" {...register('tier')} />
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

const CheckboxRow = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm has-checked:border-blue-300 has-checked:bg-blue-50/40 dark:border-zinc-800 dark:bg-zinc-950 dark:has-checked:border-blue-700 dark:has-checked:bg-blue-950/30">
    <input type="checkbox" className="h-4 w-4" {...props} />
    <span className="text-zinc-950 dark:text-white">{label}</span>
  </label>
);

const RadioRow = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm has-checked:border-blue-300 has-checked:bg-blue-50/40 dark:border-zinc-800 dark:bg-zinc-950 dark:has-checked:border-blue-700 dark:has-checked:bg-blue-950/30">
    <input type="radio" className="h-4 w-4" {...props} />
    <span className="text-zinc-950 dark:text-white">{label}</span>
  </label>
);
