import { cn } from "@/lib/cn";

/**
 * Placeholder brand mark — a simple sigil built from primitives, standing
 * in until real game artwork/logo files are added (see README "Assets").
 * Swap this component's contents for an <Image> of the real logo when
 * that art exists; every consumer only depends on this component's public
 * API, not on the fact that it's currently SVG-drawn.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <path
        d="M20 2 36 10v11c0 10-7 15.5-16 17C11 36.5 4 31 4 21V10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M20 9 29 13.5v7.6c0 6.3-4.3 9.9-9 10.9-4.7-1-9-4.6-9-10.9v-7.6Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M20 13v15M14.5 17.5 20 13l5.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-xl tracking-wide text-parchment", className)}>
      Covenant
    </span>
  );
}
