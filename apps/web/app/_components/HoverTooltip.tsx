/**
 * Lightweight CSS-only hover/focus tooltip.
 *
 * Native `title=` attributes have a 1-2 second OS-level delay and are
 * unreliable across browsers, so this component renders an instant bubble
 * on `group-hover` / `group-focus-within`. Pure Tailwind, no library.
 *
 * The trigger element retains a `title` attribute as a fallback so
 * keyboard users with assistive tech still get the announcement, and the
 * bubble itself is `aria-hidden` to avoid double-announcement.
 */

import type { ReactNode } from 'react';

interface HoverTooltipProps {
  label: string;
  children: ReactNode;
  /** Tailwind classes applied to the wrapping span. */
  className?: string;
  /**
   * Vertical placement relative to the trigger. `top` is best when the
   * trigger is near the bottom of a card; `bottom` when there's headroom
   * but no footroom. Default: `top`.
   */
  side?: 'top' | 'bottom';
}

export function HoverTooltip({
  label,
  children,
  className = '',
  side = 'top',
}: HoverTooltipProps) {
  const placement =
    side === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2';
  return (
    <span
      className={`group relative inline-flex cursor-help ${className}`}
      tabIndex={0}
      title={label}
    >
      {children}
      <span
        role="tooltip"
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-zinc-700 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 ${placement}`}
      >
        {label}
      </span>
    </span>
  );
}
