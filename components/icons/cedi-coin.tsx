import { cn } from "@/lib/utils";

/** A stylised cedi coin, used as a growth/money motif alongside the logo's gold pillars. */
export function CediCoinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("size-10", className)}
    >
      <circle cx="24" cy="24" r="18" fill="currentColor" opacity="0.14" />
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path
        d="M27.5 19a5 5 0 0 0-4-2c-3 0-5.5 3-5.5 7s2.5 7 5.5 7a5 5 0 0 0 4-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M16 22h7M16 26h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
