import React from "react";
import { AuthUser } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownLeft, SlidersHorizontal, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SuperAdminGate } from "@/components/auth/permission-gate";

interface CashDrawerData {
  id: string;
  name: string;
  currentBalance: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalExpenses?: number;
}

export function CashOverview({
  account,
  totals,
  user,
}: {
  account: CashDrawerData;
  totals: {
    totalDeposits: number;
    totalWithdrawals: number;
    totalExpenses: number;
  };
  user: AuthUser;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Shop Cash Drawer Register</span>
            <span className="text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Physical Counter
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Current verified cash on counter, owner withdrawals, and operational expenses
          </p>
        </div>

        {/* Super Admin Quick Actions */}
        <SuperAdminGate user={user}>
          <div className="flex items-center gap-2">
            <Link
              href="/ledger?action=deposit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>Cash In</span>
            </Link>
            <Link
              href="/ledger?action=withdraw"
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98]"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>Withdraw</span>
            </Link>
            <Link
              href="/ledger?action=adjust"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />
              <span>Adjust</span>
            </Link>
          </div>
        </SuperAdminGate>
      </div>

      {/* Main Drawer Balance Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Current Cash in Drawer (Primary highlight) */}
        <div className="sm:col-span-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-sm">
          <div className="flex items-center justify-between text-blue-100">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Current Cash in Hand
            </span>
            <Wallet className="h-5 w-5 text-blue-200" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
            {formatCurrency(account.currentBalance)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-100">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span>Counter Cash Drawer • Verified Balance</span>
          </div>
        </div>

        {/* Total Withdrawals */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
            Total Withdrawn
          </span>
          <div className="mt-1 text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-200">
            {formatCurrency(totals.totalWithdrawals)}
          </div>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
            Cash removed from drawer
          </p>
        </div>

        {/* Total Expenses Paid */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
            Total Expenses
          </span>
          <div className="mt-1 text-lg sm:text-xl font-bold text-rose-900 dark:text-rose-200">
            {formatCurrency(totals.totalExpenses)}
          </div>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
            Shop operational expenses
          </p>
        </div>
      </div>
    </div>
  );
}
