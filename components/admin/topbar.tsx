"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";

import { LogoIcon } from "@/components/site/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminNav } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/admin/login/actions";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export function AdminTopbar({ name, role, className }: { name: string; role: string; className?: string }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header className={cn("flex h-16 items-center justify-between border-b border-white/10 bg-navy-900 px-4 sm:px-6", className)}>
      {/* Hidden checkbox + peer-checked CSS drives the drawer natively, a
          fallback for when React hasn't hydrated yet. onChange keeps React
          state in sync (it's a controlled input) so escape-to-close and
          close-on-nav-tap keep working once JS is live — belt-and-suspenders,
          same pattern as the public header. */}
      <input
        type="checkbox"
        id="admin-mobile-nav-toggle"
        className="peer sr-only"
        checked={mobileOpen}
        onChange={(e) => setMobileOpen(e.target.checked)}
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="flex items-center gap-3 lg:hidden">
        <LogoIcon className="h-7 w-7" />
        <label
          htmlFor="admin-mobile-nav-toggle"
          role="button"
          tabIndex={0}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          className="inline-flex size-11 cursor-pointer touch-manipulation items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 active:opacity-65"
        >
          <Menu className="size-5" />
        </label>
      </div>

      <p className="hidden text-sm font-medium text-white/60 lg:block">Operations Portal</p>

      <div className="flex items-center gap-3">
        <Badge variant="gold" className="hidden capitalize sm:inline-flex">{role}</Badge>
        <Avatar className="size-8">
          <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm text-white/80 sm:inline">{name}</span>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
            <LogOut className="size-4 text-white/70" />
          </Button>
        </form>
      </div>

      {/* Always mounted (not conditionally rendered) so the peer-checked
          fallback has something to show/hide even before hydration — a
          conditional {mobileOpen ? <div/> : null} literally doesn't exist in
          the DOM until React runs, which defeats a CSS-only fallback. */}
      <div className="pointer-events-none fixed inset-0 z-50 flex opacity-0 transition-opacity duration-200 peer-checked:pointer-events-auto peer-checked:opacity-100 lg:hidden">
        <label htmlFor="admin-mobile-nav-toggle" className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <nav className="relative flex w-64 flex-col bg-navy-800 p-4">
          <label
            htmlFor="admin-mobile-nav-toggle"
            role="button"
            tabIndex={0}
            aria-label="Close menu"
            className="mb-4 inline-flex size-11 cursor-pointer touch-manipulation items-center justify-center self-end rounded-md text-white transition-colors hover:bg-white/10 active:opacity-65"
          >
            <X className="size-5" />
          </label>
          {adminNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin/operations" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                  active ? "bg-gradient-gold text-navy-900" : "text-white/70 hover:bg-white/5"
                )}
              >
                <item.icon className="size-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
