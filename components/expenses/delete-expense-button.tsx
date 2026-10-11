"use client";

import React, { useState } from "react";
import { deleteExpenseAction } from "@/actions/expense-actions";
import { formatCurrency } from "@/lib/utils";
import { Trash2, AlertCircle, Loader2, ArrowDownLeft } from "lucide-react";
import { AuthUser } from "@/lib/auth/session";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Permission } from "@prisma/client";

interface DeleteExpenseButtonProps {
  expenseId: string;
  expenseNumber: string;
  title: string;
  amount: number;
  user: AuthUser;
}

export function DeleteExpenseButton({
  expenseId,
  expenseNumber,
  title,
  amount,
  user,
}: DeleteExpenseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const res = await deleteExpenseAction(expenseId);
    setIsDeleting(false);
    if (res.success) {
      setIsOpen(false);
    } else {
      setError(res.error || "Failed to remove expense.");
    }
  };

  return (
    <>
      <PermissionGate user={user} permission={Permission.EXPENSES_DELETE}>
        <button
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
          title="Remove & Reverse to Cash Drawer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </PermissionGate>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Remove Expense & Refund Cash?
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Are you sure you want to remove <span className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</span> ({expenseNumber})?
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-emerald-50/70 p-3.5 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60">
              <ArrowDownLeft className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="font-bold">{formatCurrency(amount)}</strong> will be immediately refunded back into the <strong>Shop Cash Drawer</strong> and logged in the ledger audit trail.
              </span>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Refund & Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
