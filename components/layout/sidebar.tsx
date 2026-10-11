"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthUser } from "@/lib/auth/session";
import { logoutAction } from "@/actions/auth-actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  Receipt,
  Wallet,
  Settings2,
  LogOut,
  Layers,
  ChevronRight,
  Menu,
  X,
  Store,
  ShieldAlert,
} from "lucide-react";
import { Permission, RoleType } from "@prisma/client";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user: AuthUser;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  permission?: Permission;
  superAdminOnly?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Service Orders",
    href: "/orders",
    icon: FileCheck2,
    permission: Permission.ORDERS_VIEW,
  },
  {
    title: "Services Catalog",
    href: "/services",
    icon: Layers,
    permission: Permission.SERVICES_VIEW,
  },
  {
    title: "Customers CRM",
    href: "/customers",
    icon: Users,
    permission: Permission.CUSTOMERS_VIEW,
  },
  {
    title: "Expenses",
    href: "/expenses",
    icon: Receipt,
    permission: Permission.EXPENSES_VIEW,
  },
  {
    title: "Virtual Cash Ledger",
    href: "/ledger",
    icon: Wallet,
    permission: Permission.LEDGER_VIEW,
  },
  {
    title: "Team & RBAC",
    href: "/users",
    icon: ShieldAlert,
    permission: Permission.USERS_VIEW,
  },
  {
    title: "Shop Settings",
    href: "/settings",
    icon: Settings2,
    permission: Permission.SETTINGS_MANAGE,
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Filter items based on user permissions or Super Admin status
  const visibleNavItems = navItems.filter((item) => {
    if (user.roleType === RoleType.SUPER_ADMIN) return true;
    if (item.superAdminOnly) return false;
    if (item.permission && !user.permissions.includes(item.permission)) return false;
    return true;
  });

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      <div className="lg:hidden fixed top-3.5 left-3.5 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 p-2 text-zinc-800 shadow-md backdrop-blur border border-zinc-200 dark:bg-zinc-900/90 dark:text-zinc-100 dark:border-zinc-800 active:scale-95 transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex w-72 h-screen flex-col justify-between border-r border-zinc-200/10 bg-white text-zinc-900 transition-transform duration-300 ease-in-out dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-100",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Shop Branding Header */}
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 px-5 py-3">
            <div className="flex items-center gap-3 truncate">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-extrabold text-sm">
                <Store className="h-5 w-5" />
              </div>
              <div className="truncate">
                <div className="font-extrabold text-sm tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>SmartStationery</span>
                  <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-750">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  Accounts & Citizen Hub
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Management Modules
            </div>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150",
                    isActive
                      ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                        isActive
                          ? "text-white dark:text-zinc-950"
                          : "text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-white"
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Sign Out Button */}
          <div className="border-t border-zinc-150 dark:border-zinc-850 p-4">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
