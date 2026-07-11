import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand rule (see README §Brand): never place the navy-text lockup on a dark
 * background. We render the full SVG lockup in light mode and swap to the
 * icon mark + a white Cinzel wordmark set in HTML for dark surfaces.
 *
 * The icon mark's pediment and base bars are baked into the PNG as navy
 * (~#051429) — nearly identical to every dark surface we place it on (footer,
 * admin shell, login). Without a light backing chip those navy shapes vanish
 * into the background, leaving only the gold pillars and emerald arrow
 * floating. `IconChip` gives it local contrast wherever it sits on navy.
 */
function IconChip({
  className,
  imageClassName,
  alt = "",
}: {
  className?: string;
  imageClassName?: string;
  alt?: string;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-surface p-1.5", className)}>
      <Image
        src="/brand/icon-192.png"
        alt={alt}
        width={40}
        height={40}
        className={cn("h-full w-full", imageClassName)}
      />
    </span>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2", className)}>
      <span className="dark:hidden">
        <Image
          src="/brand/logo.svg"
          alt="Grainy Palace Financial Service"
          width={220}
          height={56}
          priority
          className="h-10 w-auto sm:h-12"
        />
      </span>
      <span className="hidden items-center gap-2.5 dark:flex">
        <IconChip className="size-9" />
        <span className="font-heading text-base font-semibold leading-tight tracking-wide text-white sm:text-lg">
          GRAINY PALACE
        </span>
      </span>
    </Link>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return <IconChip className={cn("size-9", className)} alt="Grainy Palace Financial Service" />;
}
