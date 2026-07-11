import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BookText,
  FileText,
  Gauge,
  Inbox,
  Landmark,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { SusuTinIcon } from "@/components/icons/susu-tin";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
}

export const adminNav: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/operations", icon: Gauge },
  { label: "Clients", href: "/admin/operations/clients", icon: Users },
  { label: "Susu Collections", href: "/admin/operations/susu", icon: SusuTinIcon },
  { label: "Deposits", href: "/admin/operations/deposits", icon: Wallet },
  { label: "Loans", href: "/admin/operations/loans", icon: Banknote },
  { label: "Treasury & Cash", href: "/admin/operations/treasury", icon: Landmark },
  { label: "Ledger", href: "/admin/operations/ledger", icon: BookText },
  { label: "Reports", href: "/admin/operations/reports", icon: FileText },
  { label: "Website Inbox", href: "/admin/inbox", icon: Inbox },
  { label: "Content & Settings", href: "/admin/content", icon: Settings },
];
