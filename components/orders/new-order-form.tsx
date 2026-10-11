"use client";

import React, { useActionState, useState } from "react";
import { createOrderAction, OrderActionResult } from "@/actions/order-actions";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  User,
  Calculator,
  Wallet,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  advanceBalance?: number;
  currentDue?: number;
}

interface Service {
  id: string;
  name: string;
  baseCharge: number;
  govtFee: number;
  customFields: {
    fieldId: string;
    label: string;
    fieldType: string;
    required: boolean;
    placeholder?: string | null;
  }[];
}

interface CashAccount {
  id: string;
  name: string;
  currentBalance: number;
}

export function NewOrderForm({
  customers,
  services,
  accounts,
}: {
  customers: Customer[];
  services: Service[];
  accounts: CashAccount[];
}) {
  const router = useRouter();

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || "");
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || "");
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");

  const [extraFee, setExtraFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState<number | "">(0);

  // Dynamic field key-value state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const customerAdvance = selectedCustomer?.advanceBalance || 0;

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];
  const baseCharge = selectedService?.baseCharge || 0;
  const govtFee = selectedService?.govtFee || 0;
  const totalAmount = Math.max(0, baseCharge + govtFee + (extraFee || 0) - (discount || 0));
  const numericPaid = typeof paidAmount === "number" ? paidAmount : 0;
  const initialDue = Math.max(0, totalAmount - numericPaid);
  const advanceApplied = Math.min(customerAdvance, initialDue);
  const finalDue = Math.max(0, initialDue - advanceApplied);

  const [state, formAction, isPending] = useActionState(
    async (prev: OrderActionResult | null, formData: FormData) => {
      // Serialize dynamic custom field responses
      const formattedCustomValues = (selectedService?.customFields || []).map((f) => ({
        fieldId: f.fieldId,
        label: f.label,
        value: customFieldValues[f.fieldId] || "",
      }));
      formData.set("customValuesJson", JSON.stringify(formattedCustomValues));

      const res = await createOrderAction(prev, formData);
      if (res.success) {
        router.push("/orders");
        router.refresh();
      }
      return res;
    },
    null
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {state?.error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Customer & Service Choice */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>Customer & Service Selection</span>
            </h3>

            {/* Select Customer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select Customer *
              </label>
              <select
                name="customerId"
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {(c.advanceBalance || 0) > 0 ? `— [৳${c.advanceBalance} Advance]` : ""}
                  </option>
                ))}
              </select>

              {customerAdvance > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-2 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Customer Advance Credit:</span>
                  </div>
                  <span className="font-bold font-mono text-emerald-700 dark:text-emerald-200">
                    ৳{customerAdvance.toFixed(2)} (auto-applied)
                  </span>
                </div>
              )}
            </div>

            {/* Select Service */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Select Service *
              </label>
              <select
                name="serviceId"
                required
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  setCustomFieldValues({});
                }}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — Shop: ৳{s.baseCharge} {s.govtFee > 0 ? `+ Govt: ৳${s.govtFee}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Custom Fields Schema Rendered On the Fly */}
            {selectedService?.customFields && selectedService.customFields.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Service Application Inputs
                </div>
                {selectedService.customFields.map((field) => (
                  <div key={field.fieldId}>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={field.fieldType === "number" ? "number" : "text"}
                      required={field.required}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      value={customFieldValues[field.fieldId] || ""}
                      onChange={(e) =>
                        setCustomFieldValues({
                          ...customFieldValues,
                          [field.fieldId]: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Counter Notes / Instructions
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Special instructions or document receipt notes..."
                className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Right Column: Pricing & Cash Settlement */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-600" />
              <span>Financials & Settlement</span>
            </h3>

            {/* Breakdown Display */}
            <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 text-xs dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Base Service Charge:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(baseCharge)}
                </span>
              </div>
              {govtFee > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Govt Fee / Challan:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(govtFee)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Total Payable:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Adjustments: Extra Fee & Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Extra Fee (৳)
                </label>
                <input
                  type="number"
                  name="extraFee"
                  min="0"
                  value={extraFee}
                  onChange={(e) => setExtraFee(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Discount (৳)
                </label>
                <input
                  type="number"
                  name="discount"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Payment Collection */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Amount Paid Today (৳) *
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    min="0"
                    step="0.01"
                    required
                    value={paidAmount}
                    onChange={(e) =>
                      setPaidAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Settlement Method
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    Cash in Hand (Counter)
                  </div>
                  <input type="hidden" name="paymentMethod" value="CASH" />
                  <input type="hidden" name="accountId" value={selectedAccountId} />
                </div>
              </div>

              {/* Deposit to Cash Drawer Register */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs dark:bg-blue-950/20 dark:border-blue-900/40">
                <span className="font-semibold text-blue-900 dark:text-blue-300">
                  Credit To: {accounts[0]?.name || "Shop Cash Drawer"}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Drawer Balance: {formatCurrency(accounts[0]?.currentBalance || 0)}
                </span>
              </div>

              {/* Advance Credit Applied */}
              {advanceApplied > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Advance Credit Auto-Applied:</span>
                  </div>
                  <span className="font-bold">
                    -{formatCurrency(advanceApplied)}
                  </span>
                </div>
              )}

              {/* Outstanding Due Indicator */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 text-xs font-medium border border-amber-200 dark:border-amber-900/40">
                <span>Remaining Due:</span>
                <span className="font-bold text-sm">
                  {formatCurrency(finalDue)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 active:scale-[0.99] dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing & Logging to Ledger...</span>
                </>
              ) : (
                <>
                  <span>Create Order & Log Payment</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
