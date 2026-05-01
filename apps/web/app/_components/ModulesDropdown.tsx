'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { ModuleMetadata } from '@iwc/controls';

interface ModulesDropdownProps {
  modules: ModuleMetadata[];
  linkClass: string;
}

/**
 * Client-side Modules menu. Hovers open and close it, clicking the
 * trigger toggles it explicitly, clicking a menu item closes it (so the
 * dropdown is gone the instant Next.js starts navigating), and clicking
 * outside closes it.
 *
 * The transparent `pt-2` bridge on the floating wrapper is what lets the
 * cursor cross the gap between the trigger button and the visible menu
 * without the menu closing.
 */
export function ModulesDropdown({ modules, linkClass }: ModulesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className={linkClass}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((o) => !o)}
      >
        Modules
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`ml-1 h-4 w-4 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <ul
            role="menu"
            className="w-72 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            {modules.map((m) => (
              <li key={m.id} role="none">
                {m.status === 'shipped' ? (
                  <Link
                    href={`/modules/${m.id}/`}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    <span>{m.name}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <span
                        aria-hidden="true"
                        className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
                      />
                      Live
                    </span>
                  </Link>
                ) : (
                  <span
                    role="menuitem"
                    aria-disabled="true"
                    className="flex cursor-not-allowed flex-col px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    <span>{m.name}</span>
                    <span className="text-xs">Coming soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
