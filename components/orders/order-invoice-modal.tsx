"use client";

import React, { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Printer, Receipt, X, CheckCircle2, AlertCircle } from "lucide-react";

export interface OrderInvoiceData {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    nidNumber?: string | null;
    birthRegNumber?: string | null;
  };
  service: {
    name: string;
  };
  baseCharge: number;
  govtFee: number;
  extraFee: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  customValues?: { fieldId?: string; label: string; value: string }[];
  notes?: string | null;
  createdAt: Date;
  servedBy?: {
    name: string;
  } | null;
}

interface OrderInvoiceModalProps {
  order: OrderInvoiceData;
  triggerButton?: React.ReactNode;
}

export function OrderInvoiceModal({ order, triggerButton }: OrderInvoiceModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isFullyPaid = order.dueAmount <= 0 || order.paymentStatus === PaymentStatus.PAID;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)}>{triggerButton}</span>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition"
          title="Print Invoice / Cash Memo"
        >
          <Receipt className="h-4 w-4" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          {/* Action Bar (hidden in print) */}
          <div className="w-full max-w-2xl bg-transparent my-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-t-2xl shadow-xl print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-sm">Citizen Service Invoice & Cash Memo</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div
              id="printable-invoice"
              className="w-full bg-white text-slate-900 p-8 shadow-2xl print:shadow-none print:m-0 print:p-6 print:w-full border-x border-b border-slate-200 rounded-b-2xl print:rounded-none"
            >
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950">
                  AL-BARAKA STATIONARY & ONLINE SERVICE
                </h1>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Computer Stationary, NID, Birth Reg, Passport & Cyber Point
                </p>
                <p className="text-[11px] text-slate-500">
                  Shop No. 12, Main Bazar Road • Mobile: +880 1700-000000
                </p>
                <div className="inline-block mt-2 rounded bg-slate-900 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white">
                  Customer Cash Memo / Official Invoice
                </div>
              </div>

              {/* Meta details */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 font-semibold">Invoice No: </span>
                    <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Date & Time: </span>
                    <span className="font-medium text-slate-800">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Served By: </span>
                    <span className="font-medium text-slate-800">{order.servedBy?.name || "Counter Staff"}</span>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <div>
                    <span className="text-slate-500 font-semibold">Customer: </span>
                    <span className="font-bold text-slate-900">{order.customer.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Contact: </span>
                    <span className="font-mono text-slate-800">{order.customer.phone}</span>
                  </div>
                  {order.customer.nidNumber && (
                    <div>
                      <span className="text-slate-500 font-semibold">NID: </span>
                      <span className="font-mono text-slate-800">{order.customer.nidNumber}</span>
                    </div>
                  )}
                  {order.customer.birthRegNumber && (
                    <div>
                      <span className="text-slate-500 font-semibold">BRIS: </span>
                      <span className="font-mono text-slate-800">{order.customer.birthRegNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Citizen Details Box (if any dynamic fields) */}
              {order.customValues && order.customValues.length > 0 && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                  <span className="font-bold text-[10px] uppercase text-slate-600 block mb-1">
                    Application Information Captured:
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {order.customValues.map((cv, i) => (
                      <div key={i} className="flex justify-between border-b border-slate-200/60 py-0.5">
                        <span className="text-slate-500 text-[11px]">{cv.label}:</span>
                        <span className="font-mono font-semibold text-slate-800 text-[11px]">{cv.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service & Items Table */}
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-300">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 text-[11px] uppercase font-bold text-slate-700">
                    <tr>
                      <th className="py-2 px-3">Service Description</th>
                      <th className="py-2 px-3 text-right">Fee Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {order.service.name}
                        <span className="block text-[10px] font-normal text-slate-500">
                          Workflow: {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        <div>Base Charge: {formatCurrency(order.baseCharge)}</div>
                        {order.govtFee > 0 && (
                          <div className="text-slate-500 text-[11px]">
                            Govt Portal Fee: {formatCurrency(order.govtFee)}
                          </div>
                        )}
                        {order.extraFee > 0 && (
                          <div className="text-slate-500 text-[11px]">
                            Extra/Urgent: {formatCurrency(order.extraFee)}
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="text-emerald-600 text-[11px]">
                            Discount: -{formatCurrency(order.discount)}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals & Payment Summary */}
              <div className="mt-4 flex justify-between items-start">
                {/* Stamp */}
                <div className="pt-2">
                  {isFullyPaid ? (
                    <div className="inline-flex items-center gap-1.5 border-2 border-emerald-600 text-emerald-700 px-4 py-1.5 rounded-lg font-black text-sm uppercase tracking-wider rotate-[-2deg]">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>PAID IN FULL</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 border-2 border-rose-600 text-rose-700 px-4 py-1.5 rounded-lg font-black text-sm uppercase tracking-wider rotate-[-2deg]">
                      <AlertCircle className="h-5 w-5" />
                      <span>DUE: {formatCurrency(order.dueAmount)}</span>
                    </div>
                  )}
                  {order.notes && (
                    <p className="mt-2 text-[10px] text-slate-500 max-w-xs italic">
                      Note: {order.notes}
                    </p>
                  )}
                </div>

                {/* Financial figures */}
                <div className="w-56 text-xs space-y-1">
                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Subtotal / Total:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-100">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(order.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-t-2 border-slate-800 text-sm">
                    <span className="font-bold text-slate-900">Balance Due:</span>
                    <span className={order.dueAmount > 0 ? "font-black text-rose-600" : "font-bold text-emerald-600"}>
                      {formatCurrency(order.dueAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs">
                <div>
                  <div className="w-36 border-t border-slate-400 mx-auto pt-1 font-semibold text-slate-600">
                    Customer Signature
                  </div>
                </div>
                <div>
                  <div className="w-36 border-t border-slate-400 mx-auto pt-1 font-semibold text-slate-600">
                    Authorized Cashier
                  </div>
                </div>
              </div>

              {/* Footnote */}
              <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-3">
                Computer Generated Invoice • Please preserve this slip during certificate collection
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </>
  );
}
