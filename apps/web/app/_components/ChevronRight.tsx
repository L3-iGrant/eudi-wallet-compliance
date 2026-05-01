interface ChevronRightProps {
  className?: string;
}

/**
 * Right-pointing chevron used on CTAs, "more" links, and breadcrumb tails.
 * Matches the Get Started button on docs.igrant.io for visual consistency
 * across the iGrant.io property family.
 */
export function ChevronRight({ className }: ChevronRightProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M6 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
