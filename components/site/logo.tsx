import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand rule (see README §Brand): never place the navy-text lockup on a dark
 * background. We render the full SVG lockup in light mode and swap to the
 * icon mark + a white Cinzel wordmark set in HTML for dark surfaces.
 */
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
        <Image src="/brand/icon-192.png" alt="" width={40} height={40} className="h-9 w-9" />
        <span className="font-heading text-base font-semibold leading-tight tracking-wide text-white sm:text-lg">
          GRAINY PALACE
        </span>
      </span>
    </Link>
  );
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/icon-192.png"
      alt="Grainy Palace Financial Service"
      width={40}
      height={40}
      className={cn("h-9 w-9", className)}
    />
  );
}
