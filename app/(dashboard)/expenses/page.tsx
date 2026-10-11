import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { CreateExpenseModal } from "@/components/expenses/create-expense-modal";
import { ExpensesTableClient } from "@/components/expenses/expenses-table-client";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Permission } from "@prisma/client";
import { Receipt, Calendar, Wallet } from "lucide-react";

export default async function ExpensesPage() {
  const user = await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [expenses, categories, accounts, allTimeExpenseAggr, todayExpenseAggr] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.expenseCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.cashAccount.findMany({
      where: { isActive: true },
      select: { id: true, name: true, currentBalance: true },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: today } },
      _sum: { amount: true },
    }),
  ]);

  const totalExpenseAllTime = allTimeExpenseAggr._sum.amount || 0;
  const todayExpenseTotal = todayExpenseAggr._sum.amount || 0;
  const drawerBalance = accounts[0]?.currentBalance || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Shop Expense Management</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              {expenses.length} Records
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Categorized daily shop expenditures, utility bills, paper supplies, and automatic cash drawer deductions & reversals
          </p>
        </div>

        <PermissionGate user={user} permission={Permission.EXPENSES_CREATE}>
          <CreateExpenseModal categories={categories} accounts={accounts} />
        </PermissionGate>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total All-Time Expenses */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Total All-Time Expenses
            </span>
            <Receipt className="h-5 w-5 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400 font-mono">
            {formatCurrency(totalExpenseAllTime)}
          </div>
          <div className="mt-1 text-xs text-rose-600/80">
            Across {categories.length} registered expense categories
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              Today&apos;s Expenses
            </span>
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-800 dark:text-amber-300 font-mono">
            {formatCurrency(todayExpenseTotal)}
          </div>
          <div className="mt-1 text-xs text-amber-600/80">
            Paid out from drawer today
          </div>
        </div>

        {/* Available Cash in Drawer */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/50 dark:bg-blue-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
              Available Drawer Balance
            </span>
            <Wallet className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-800 dark:text-blue-300 font-mono">
            {formatCurrency(drawerBalance)}
          </div>
          <div className="mt-1 text-xs text-blue-600/80">
            Counter cash available for payout
          </div>
        </div>
      </div>

      {/* Expenses Table with Live Search, Filters, and Pagination */}
      <ExpensesTableClient
        expenses={expenses as any}
        categories={categories}
        user={user}
      />
    </div>
  );
}
