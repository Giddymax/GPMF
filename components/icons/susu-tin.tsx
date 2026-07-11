import { cn } from "@/lib/utils";

/** A stylised susu collection tin, echoing the coin-slot ritual of daily saving. */
export function SusuTinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("size-10", className)}
    >
      <ellipse cx="24" cy="14" rx="14" ry="4" fill="currentColor" opacity="0.25" />
      <rect x="10" y="14" width="28" height="22" rx="3" fill="currentColor" opacity="0.12" />
      <path
        d="M10 14v20a3 3 0 0 0 3 3h22a3 3 0 0 0 3-3V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="14" rx="14" ry="4" stroke="currentColor" strokeWidth="2" />
      <rect x="19" y="9" width="10" height="3" rx="1.5" fill="currentColor" />
      <path d="M20 21h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
