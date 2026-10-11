"use client";

import React, { useActionState, useState } from "react";
import {
  manualDepositAction,
  manualWithdrawAction,
  manualAdjustmentAction,
  LedgerActionResult,
} from "@/actions/ledger-actions";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface CashAccount {
  id: string;
  name: string;
  currentBalance: number;
}

export function LedgerActionsModal({
  accounts,
  defaultAction = null,
}: {
  accounts: CashAccount[];
  defaultAction?: "deposit" | "withdraw" | "adjust" | null;
}) {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "adjust" | null>(
    defaultAction
  );
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");

  // Deposit Form State
  const [depositState, depositFormAction, isDepositPending] = useActionState(
    async (prev: LedgerActionResult | null, formData: FormData) => {
      const res = await manualDepositAction(prev, formData);
      if (res.success) setActiveTab(null);
      return res;
    },
    null
  );

  // Withdraw Form State
  const [withdrawState, withdrawFormAction, isWithdrawPending] = useActionState(
    async (prev: LedgerActionResult | null, formData: FormData) => {
      const res = await manualWithdrawAction(prev, formData);
      if (res.success) setActiveTab(null);
      return res;
    },
    null
  );

  // Adjustment Form State
  const [adjustState, adjustFormAction, isAdjustPending] = useActionState(
    async (prev: LedgerActionResult | null, formData: FormData) => {
      const res = await manualAdjustmentAction(prev, formData);
      if (res.success) setActiveTab(null);
      return res;
    },
    null
  );

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  return (
    <>
      {/* Trigger Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab("deposit")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
        >
          <ArrowDownLeft className="h-4 w-4" />
          <span>Manual Deposit</span>
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition"
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>Manual Withdraw</span>
        </button>
        <button
          onClick={() => setActiveTab("adjust")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-200 active:scale-95 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
        >
          <SlidersHorizontal className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span>Audit Adjustment</span>
        </button>
      </div>

      {/* Modal Dialog */}
      {activeTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-2xl text-white ${
                    activeTab === "deposit"
                      ? "bg-emerald-600"
                      : activeTab === "withdraw"
                      ? "bg-rose-600"
                      : "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                  }`}
                >
                  {activeTab === "deposit" && <ArrowDownLeft className="h-5 w-5" />}
                  {activeTab === "withdraw" && <ArrowUpRight className="h-5 w-5" />}
                  {activeTab === "adjust" && <SlidersHorizontal className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize tracking-tight">
                    {activeTab === "deposit" && "Manual Cash Deposit (Cash In)"}
                    {activeTab === "withdraw" && "Manual Cash Withdrawal (Cash Out)"}
                    {activeTab === "adjust" && "Audit Cash Balance Adjustment"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Super Admin restricted operational ledger adjustment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab(null)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Register Indicator */}
              <div className="flex items-center justify-between rounded-2xl bg-zinc-50/80 p-3.5 border border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-800">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Register: <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedAccount?.name || "Shop Cash Drawer"}</span>
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Available: {formatCurrency(selectedAccount?.currentBalance || 0)}
                </span>
              </div>

              {/* 1. Deposit Form */}
              {activeTab === "deposit" && (
                <form id="deposit-form" action={depositFormAction} className="space-y-4">
                  <input type="hidden" name="accountId" value={selectedAccountId} />
                  {depositState?.error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{depositState.error}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Deposit Amount (৳ BDT) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      placeholder="e.g. 5000"
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Reason / Source Note *
                    </label>
                    <input
                      type="text"
                      name="note"
                      required
                      placeholder="e.g. Owner capital injection for morning change"
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                </form>
              )}

              {/* 2. Withdraw Form */}
              {activeTab === "withdraw" && (
                <form id="withdraw-form" action={withdrawFormAction} className="space-y-4">
                  <input type="hidden" name="accountId" value={selectedAccountId} />
                  {withdrawState?.error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{withdrawState.error}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Withdrawal Amount (৳ BDT) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      required
                      placeholder="e.g. 2000"
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 font-bold"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Available balance: {formatCurrency(selectedAccount?.currentBalance || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Withdrawal Purpose / Note *
                    </label>
                    <input
                      type="text"
                      name="note"
                      required
                      placeholder="e.g. Owner profit withdrawal / Personal drawing"
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                </form>
              )}

              {/* 3. Adjustment Form */}
              {activeTab === "adjust" && (
                <form id="adjust-form" action={adjustFormAction} className="space-y-4">
                  <input type="hidden" name="accountId" value={selectedAccountId} />
                  {adjustState?.error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{adjustState.error}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Actual Physical Count / Verified Balance (৳ BDT) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="actualBalance"
                      required
                      placeholder={selectedAccount?.currentBalance.toString()}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 font-bold"
                    />
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Current system balance is {formatCurrency(selectedAccount?.currentBalance || 0)}. The difference will be logged into the permanent audit trail.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Mandatory Audit Justification / Reason *
                    </label>
                    <textarea
                      name="reason"
                      required
                      rows={2}
                      placeholder="e.g. End of day physical cash count discrepancy reconciliation."
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Modal Sticky Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              {activeTab === "deposit" && (
                <button
                  type="submit"
                  form="deposit-form"
                  disabled={isDepositPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {isDepositPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Deposit
                </button>
              )}
              {activeTab === "withdraw" && (
                <button
                  type="submit"
                  form="withdraw-form"
                  disabled={isWithdrawPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {isWithdrawPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Withdrawal
                </button>
              )}
              {activeTab === "adjust" && (
                <button
                  type="submit"
                  form="adjust-form"
                  disabled={isAdjustPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white disabled:opacity-50 transition"
                >
                  {isAdjustPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Apply Audit Adjustment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
