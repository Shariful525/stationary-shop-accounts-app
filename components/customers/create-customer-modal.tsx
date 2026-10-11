"use client";

import React, { useActionState, useState } from "react";
import { createCustomerAction, CustomerActionResult } from "@/actions/customer-actions";
import { UserPlus, X, AlertCircle, Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

export function CreateCustomerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (prev: CustomerActionResult | null, formData: FormData) => {
      const res = await createCustomerAction(prev, formData);
      if (res.success) {
        setIsOpen(false);
        setCustomerName("");
      }
      return res;
    },
    null
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition"
      >
        <UserPlus className="h-4 w-4" />
        <span>Add New Customer</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-extrabold text-sm">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                    Register Customer Profile
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Add citizen contact details, photo, NID & birth certificate reference
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

            {state?.error && (
              <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Profile Picture Upload to Cloudflare R2 */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <ImageUpload
                  label="Citizen Profile Photo (Cloudflare R2)"
                  urlFieldName="profilePhotoUrl"
                  keyFieldName="profilePhotoKey"
                  folder="customers"
                  fallbackInitial={customerName || "C"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Kamal Hossain"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="017XXXXXXXX"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    NID Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="nidNumber"
                    placeholder="10 or 17 digit NID"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Birth Reg. # (BRIS)
                  </label>
                  <input
                    type="text"
                    name="birthRegNumber"
                    placeholder="17 digit BRIS number"
                    className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="customer@email.com"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Address (Village / Road / Thana)
                </label>
                <input
                  type="text"
                  name="street"
                  placeholder="e.g. Char Fasson, Bhola"
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
                  disabled={isPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
