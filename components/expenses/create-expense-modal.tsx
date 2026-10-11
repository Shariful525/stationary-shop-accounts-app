"use client";

import React, { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createExpenseAction, ExpenseActionResult } from "@/actions/expense-actions";
import { formatCurrency } from "@/lib/utils";
import { ReceiptText, X, AlertCircle, Loader2, Sparkles, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface CashAccount {
  id: string;
  name: string;
  currentBalance: number;
}

export function CreateExpenseModal({
  categories,
  accounts,
}: {
  categories: Category[];
  accounts: CashAccount[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");

  const [state, formAction, isPending] = useActionState(
    async (prev: ExpenseActionResult | null, formData: FormData) => {
      const res = await createExpenseAction(prev, formData);
      if (res.success) {
        router.refresh();
        setIsOpen(false);
        setIsCustomCategory(false);
        setCustomCategoryName("");
      }
      return res;
    },
    null
  );

  return (
    <>
      <button
        onClick={() => {
          setIsCustomCategory(false);
          setCustomCategoryName("");
          setSelectedCategoryId(categories[0]?.id || "");
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 active:scale-95 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition"
      >
        <ReceiptText className="h-4 w-4" />
        <span>Record Shop Expense</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Record Shop Expense
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Debits Shop Cash Drawer and logs ledger outflow
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form action={formAction} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {state?.error && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{state.error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Expense Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. 5 Reams A4 80GSM Printing Paper, Electricity Bill"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                  />
                </div>

                {/* Category Selection & Custom Writing */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Expense Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) {
                          setCustomCategoryName("");
                        }
                      }}
                      className="text-[11px] font-bold text-zinc-900 hover:underline dark:text-zinc-100 flex items-center gap-1 transition"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{isCustomCategory ? "← Pick From List" : "+ Write My Own"}</span>
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <div>
                      <input
                        type="text"
                        name="customCategoryName"
                        required
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        placeholder="Type your category name (e.g. Generator Fuel, Tea & Snacks)"
                        className="w-full rounded-xl border-2 border-zinc-900 bg-zinc-50/50 p-2.5 text-xs font-semibold outline-none dark:border-zinc-400 dark:bg-zinc-900/50 dark:text-zinc-100"
                        autoFocus
                      />
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        ✨ This new category will be automatically saved and available for future expenses!
                      </p>
                    </div>
                  ) : (
                    <select
                      name="categoryId"
                      required
                      value={selectedCategoryId}
                      onChange={(e) => {
                        if (e.target.value === "__NEW__") {
                          setIsCustomCategory(true);
                        } else {
                          setSelectedCategoryId(e.target.value);
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__NEW__" className="font-bold text-zinc-900 dark:text-zinc-100">
                        + Write My Own Category...
                      </option>
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Amount (৳ BDT) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      min="1"
                      required
                      placeholder="e.g. 1750"
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-bold text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                </div>

                {/* Direct Cash Drawer Deduction */}
                <input type="hidden" name="accountId" value={accounts[0]?.id || ""} />
                <input type="hidden" name="paymentMethod" value="CASH" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-2xl bg-zinc-50/80 p-3.5 border border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Paid From: <span className="font-bold text-zinc-900 dark:text-zinc-100">{accounts[0]?.name || "Shop Cash Drawer"}</span>
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Drawer Balance: {formatCurrency(accounts[0]?.currentBalance || 0)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Voucher / Memo Remarks (Optional)
                  </label>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder="Receipt number, supplier name, or remarks..."
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                  />
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm & Deduct Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
