import React from "react";
import Link from "next/link";
import { AuthUser } from "@/lib/auth/session";
import { PermissionGate, SuperAdminGate } from "@/components/auth/permission-gate";
import { Permission } from "@prisma/client";
import {
  FilePlus2,
  UserPlus,
  ReceiptText,
  SlidersHorizontal,
  Printer,
  Sparkles,
} from "lucide-react";

export function QuickActions({ user }: { user: AuthUser }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Counter Quick Actions</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Frequently performed front-desk citizen and accounts operations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* New Service Application */}
        <PermissionGate user={user} permission={Permission.ORDERS_CREATE}>
          <Link
            href="/orders/new"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 text-center transition hover:bg-blue-100/60 hover:shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                New Order
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                NID / Passport / Birth
              </span>
            </div>
          </Link>
        </PermissionGate>

        {/* New Customer */}
        <PermissionGate user={user} permission={Permission.CUSTOMERS_CREATE}>
          <Link
            href="/customers/new"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-purple-200/80 bg-purple-50/50 p-4 text-center transition hover:bg-purple-100/60 hover:shadow-sm dark:border-purple-900/40 dark:bg-purple-950/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm shadow-purple-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Add Customer
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Register CRM Profile
              </span>
            </div>
          </Link>
        </PermissionGate>

        {/* Add Expense */}
        <PermissionGate user={user} permission={Permission.EXPENSES_CREATE}>
          <Link
            href="/expenses/new"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/50 p-4 text-center transition hover:bg-rose-100/60 hover:shadow-sm dark:border-rose-900/40 dark:bg-rose-950/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm shadow-rose-500/20">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Add Expense
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Rent, Bills & Paper
              </span>
            </div>
          </Link>
        </PermissionGate>

        {/* Audit Adjustment (Strictly Super Admin Only) */}
        <SuperAdminGate user={user}>
          <Link
            href="/ledger?action=adjust"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 text-center transition hover:bg-amber-100/60 hover:shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm shadow-amber-500/20">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Cash Adjustment
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Audit Drawer Tally
              </span>
            </div>
          </Link>
        </SuperAdminGate>
      </div>
    </div>
  );
}
