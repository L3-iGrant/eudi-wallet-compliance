'use client';

import { useEffect, useState } from 'react';
import { OPEN_SEARCH_EVENT } from './SearchOverlay';

export function SearchTrigger() {
  const [shortcut, setShortcut] = useState<'⌘K' | 'Ctrl K'>('⌘K');

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShortcut(isMac ? '⌘K' : 'Ctrl K');
  }, []);

  const open = () =>
    window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT));

  return (
    <>
      {/*
        Desktop trigger: looks like a wide search input with the icon on
        the left, "Search" label, and the keyboard shortcut tucked to
        the far right via ml-auto. Visible from md (768px) up.
      */}
      <button
        type="button"
        onClick={open}
        className="hidden items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 md:inline-flex md:w-48 lg:w-56 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
        aria-label="Search the catalogue"
      >
        <SearchIcon className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="ml-auto rounded border border-zinc-200 bg-zinc-100 px-1 py-px font-mono text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          {shortcut}
        </kbd>
      </button>

      {/*
        Mobile trigger: square icon button, visible below md. The full
        labelled trigger above would dominate the navbar on small
        screens, so we collapse to an icon while keeping the same
        overlay accessible.
      */}
      <button
        type="button"
        onClick={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700 md:hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
        aria-label="Search the catalogue"
      >
        <SearchIcon className="h-4 w-4" />
      </button>
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}
