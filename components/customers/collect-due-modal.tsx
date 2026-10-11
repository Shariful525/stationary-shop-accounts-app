"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { collectDuePaymentAction } from "@/actions/order-actions";
import { formatCurrency } from "@/lib/utils";
import { Wallet, X, AlertCircle, Loader2, Sparkles } from "lucide-react";

interface CollectDueModalProps {
  customer: {
    id: string;
    name: string;
    phone: string;
    currentDue: number;
    advanceBalance?: number;
  };
}

export function CollectDueModal({ customer }: CollectDueModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<number>(customer.currentDue > 0 ? customer.currentDue : 100);
  const [note, setNote] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDue = customer.currentDue > 0;
  const advance = customer.advanceBalance || 0;

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || isNaN(amount)) return;

    setIsLoading(true);
    setError(null);

    const res = await collectDuePaymentAction(
      customer.id,
      amount,
      undefined,
      note.trim() || undefined
    );

    setIsLoading(false);

    if (res.success) {
      router.refresh();
      setIsOpen(false);
    } else {
      setError(res.error || "Failed to process payment.");
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setAmount(customer.currentDue > 0 ? customer.currentDue : 100);
          setIsOpen(true);
        }}
        className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 shadow-sm ${
          hasDue
            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/50"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-900/50"
        }`}
        title={hasDue ? "Collect Customer Due" : "Deposit Advance Amount"}
      >
        <Wallet className="h-3.5 w-3.5" />
        <span>{hasDue ? "Collect Due" : "+ Deposit Advance"}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-auto flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-extrabold text-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                    {hasDue ? "Collect Due Payment" : "Deposit Advance Credit"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {customer.name} ({customer.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCollect} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {/* Balances Banner */}
              <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/50">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                    Outstanding Due
                  </span>
                  <span className={hasDue ? "text-base font-extrabold text-rose-600 dark:text-rose-400 font-mono" : "font-bold text-zinc-400 font-mono"}>
                    {formatCurrency(customer.currentDue)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-zinc-400 mb-0.5">
                    Advance Balance
                  </span>
                  <span className={advance > 0 ? "text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono" : "font-bold text-zinc-400 font-mono"}>
                    {formatCurrency(advance)}
                  </span>
                </div>
              </div>

              {/* Informative Workflow Explainer */}
              <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/80 p-3.5 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-zinc-900 dark:text-zinc-100">
                  <Sparkles className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
                  <span>Smart Order Allocation</span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Payment deducts first from recent due orders. Any excess amount is stored in their profile as <strong>Advance Credit</strong>.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Payment Amount Received (৳ BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-base font-extrabold font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400 transition"
                />
                {hasDue && (
                  <div className="flex justify-between items-center text-[11px] text-zinc-400 mt-1.5">
                    <span>Any custom amount</span>
                    <button
                      type="button"
                      onClick={() => setAmount(customer.currentDue)}
                      className="text-zinc-900 hover:underline font-bold dark:text-zinc-200"
                    >
                      Exact Due (৳{customer.currentDue})
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Payment Notes (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Received counter cash from customer"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Receive ৳{amount} & Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
