import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { LedgerActionsModal } from "@/components/ledger/ledger-actions-modal";
import { LedgerTableClient } from "@/components/ledger/ledger-table-client";
import { SuperAdminGate } from "@/components/auth/permission-gate";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  History,
} from "lucide-react";
import { LedgerEntryType } from "@prisma/client";

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: "deposit" | "withdraw" | "adjust" }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  const [cashDrawer, ledgerEntries, totalExpensesAggr, totalWithdrawalsAggr, totalDepositsAggr] =
    await Promise.all([
      prisma.cashAccount.findFirst({
        where: { isActive: true },
        orderBy: { isDefault: "desc" },
      }),
      prisma.ledgerEntry.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          account: { select: { name: true, type: true } },
          performedBy: { select: { name: true } },
        },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { type: LedgerEntryType.WITHDRAWAL },
        _sum: { amount: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { type: LedgerEntryType.DEPOSIT },
        _sum: { amount: true },
      }),
    ]);

  const drawerBalance = cashDrawer?.currentBalance || 0;
  const totalExpenses = totalExpensesAggr._sum.amount || 0;
  const totalWithdrawals = totalWithdrawalsAggr._sum.amount || 0;
  const totalDeposits = totalDepositsAggr._sum.amount || 0;

  const accountsList = cashDrawer ? [cashDrawer] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Cash Drawer & Financial Ledger</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Double-Entry Audit
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Immutable transaction trail for shop counter cash drawer, owner withdrawals, and operational expenses
          </p>
        </div>

        {/* Super Admin Operations */}
        <SuperAdminGate user={user}>
          <LedgerActionsModal
            accounts={accountsList}
            defaultAction={params.action || null}
          />
        </SuperAdminGate>
      </div>

      {/* Account Balance & Totals Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Drawer Card */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              Cash in Drawer
            </span>
            <Wallet className="h-5 w-5 text-blue-200" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono">
            {formatCurrency(drawerBalance)}
          </div>
          <p className="mt-1 text-[11px] text-blue-100">
            Physical cash on counter register
          </p>
        </div>

        {/* Total Withdrawals */}
        <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Total Withdrawals
            </span>
            <ArrowUpRight className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalWithdrawals)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Profit & owner withdrawals
          </p>
        </div>

        {/* Total Shop Expenses */}
        <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Operational Expenses
            </span>
            <Receipt className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Total deductions from register
          </p>
        </div>

        {/* Total Capital Deposits */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Capital Injections
            </span>
            <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
            {formatCurrency(totalDeposits)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Manual cash injections / float
          </p>
        </div>
      </div>

      {/* Ledger Table with Live Search, Filters, and Pagination */}
      <LedgerTableClient ledgerEntries={ledgerEntries as any} />
    </div>
  );
}
