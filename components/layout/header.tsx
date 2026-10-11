import React from "react";
import { AuthUser } from "@/lib/auth/session";
import { Wallet, Sparkles } from "lucide-react";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";

import Link from "next/link";

interface HeaderProps {
  user: AuthUser;
}

export async function Header({ user }: HeaderProps) {
  // Query total virtual cash reserve (sum of all active cash accounts)
  const cashAccounts = await prisma.cashAccount.findMany({
    where: { isActive: true },
    select: { currentBalance: true },
  });

  const totalVirtualCash = cashAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-zinc-850 dark:bg-zinc-950/80">
      <div className="flex items-center gap-3 pl-12 lg:pl-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            System Live & Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Virtual Cash Quick Badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 px-3 py-1.5 text-xs text-zinc-800 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
          <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-semibold leading-none mb-0.5">
              Cash Drawer
            </span>
            <span className="font-extrabold font-mono leading-none">{formatCurrency(totalVirtualCash)}</span>
          </div>
        </div>

        {/* Instant Theme Toggle (Light / Dark) */}
        <ThemeToggle />

        {/* Round Profile Icon */}
        <Link
          href="/settings"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/90 bg-white shadow-xs transition hover:ring-2 hover:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden shrink-0 active:scale-95"
          title={`${user.name} - Profile & Settings`}
          aria-label="Profile & Settings"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-950 font-mono">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
