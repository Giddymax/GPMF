import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The flat brand-kit lockup (logo.svg / logo-*.png) bakes "FINANCIAL SERVICE"
 * in at a fixed proportion to the wordmark — legible in a hero or on a
 * letterhead, but the whole image has to shrink to header height (~40-48px),
 * at which point the subtitle line becomes only a few pixels tall. We
 * reproduce the wordmark + subtitle as real HTML text (Cinzel / Montserrat,
 * per the brand kit's own type spec) instead, so it stays crisp at any size
 * and adapts to light/dark automatically via the theme CSS variables.
 *
 * The icon mark's pediment and base bars are baked into the PNG as navy
 * (~#051429) — nearly identical to any navy surface it sits on. `chip="always"`
 * gives it a light backing on surfaces that are unconditionally navy (footer,
 * admin shell); `chip="dark"` only adds that backing when the site theme
 * itself is dark (the header, whose background flips with the theme).
 */
function IconMark({
  className,
  chip = "dark",
}: {
  className?: string;
  chip?: "always" | "dark";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        chip === "always" ? "bg-surface p-1.5" : "dark:bg-surface dark:p-1.5",
        className
      )}
    >
      <Image src="/brand/icon-192.png" alt="" width={40} height={40} className="h-full w-full" />
    </span>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <IconMark chip="dark" className="size-9 sm:size-10" />
      <span className="flex flex-col justify-center leading-none">
        <span className="font-heading text-base font-semibold tracking-wide text-foreground sm:text-lg">
          GRAINY PALACE
        </span>
        <span className="-mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-[10px]">
          Financial Service
        </span>
      </span>
    </Link>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return <IconMark chip="always" className={cn("size-9", className)} />;
}
