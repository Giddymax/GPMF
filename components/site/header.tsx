"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Menu, Phone, X } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navLinks, productLinks, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const checkboxRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      {/* Hidden checkbox + peer-checked CSS drives the mobile panel natively —
          a fallback that works even if React hasn't hydrated yet (slow phone,
          flaky connection). The label below is a real, JS-free toggle; its
          onChange just keeps React state in sync so escape-to-close and
          close-on-link-tap keep working once JS is live. Belt-and-suspenders
          on purpose, not redundant: either mechanism alone can fail. */}
      <input
        ref={checkboxRef}
        type="checkbox"
        id="mobile-nav-toggle"
        className="peer sr-only"
        checked={mobileOpen}
        onChange={(e) => setMobileOpen(e.target.checked)}
        aria-hidden="true"
        tabIndex={-1}
      />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-gold-700"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-gold-700"
          >
            About
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-gold-700">
                Products <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {productLinks.map((p) => (
                <DropdownMenuItem key={p.href} asChild>
                  <Link href={p.href} className="flex flex-col items-start gap-0.5 py-2">
                    <span className="font-medium">{p.label}</span>
                    <span className="text-xs text-muted-foreground">{p.blurb}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <Link href="/products" className="font-medium text-gold-700">
                  All products
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {navLinks.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-gold-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={siteConfig.phoneHref}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone className="size-4" />
            {siteConfig.phoneDisplay}
          </a>
          <ThemeToggle />
          <Button asChild>
            <Link href="/apply">Open an Account</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <label
            htmlFor="mobile-nav-toggle"
            role="button"
            tabIndex={0}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                checkboxRef.current?.click();
              }
            }}
            className="inline-flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted active:opacity-65"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </label>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background transition-all duration-200 lg:hidden",
          "peer-checked:max-h-[32rem] peer-checked:border-t",
          mobileOpen ? "max-h-[32rem]" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile">
          {[{ label: "Home", href: "/" }, ...navLinks.slice(1)].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
          <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Products
          </p>
          {productLinks.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              {p.label}
            </Link>
          ))}
          <a
            href={siteConfig.phoneHref}
            className="mt-2 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground"
          >
            <Phone className="size-4" /> {siteConfig.phoneDisplay}
          </a>
          <Button asChild className="mx-3 mt-1">
            <Link href="/apply" onClick={() => setMobileOpen(false)}>
              Open an Account
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
