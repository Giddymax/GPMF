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
      <div className="flex items-center gap-3 lg:hidden">
        <LogoIcon className="h-7 w-7" />
        <Button variant="ghost" size="icon" className="size-11" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="size-5 text-white" />
        </Button>
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

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <nav className="relative flex w-64 flex-col bg-navy-800 p-4">
            <Button
              variant="ghost"
              size="icon"
              className="mb-4 size-11 self-end"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5 text-white" />
            </Button>
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
      ) : null}
    </header>
  );
}
