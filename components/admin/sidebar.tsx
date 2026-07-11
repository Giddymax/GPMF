"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoIcon } from "@/components/site/logo";
import { adminNav } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn("hidden w-64 shrink-0 flex-col border-r border-white/10 bg-navy-800 lg:flex", className)}>
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <LogoIcon className="h-8 w-8" />
        <div>
          <p className="font-heading text-sm font-semibold leading-tight text-white">GRAINY PALACE</p>
          <p className="text-[10px] uppercase tracking-wide text-white/40">Operations Portal</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {adminNav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin/operations" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-gradient-gold text-navy-900" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
