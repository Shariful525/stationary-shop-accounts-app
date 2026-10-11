import React from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatus, PaymentStatus, LedgerEntryType } from "@prisma/client";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  totalAmount: number;
  paidAmount?: number;
  dueAmount?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

export interface RecentLedger {
  id: string;
  entryNumber: string;
  accountName: string;
  type: LedgerEntryType;
  amount: number;
  direction: "INFLOW" | "OUTFLOW";
  note: string;
  createdAt: Date;
}

export function RecentActivity({
  orders,
  ledger,
}: {
  orders: RecentOrder[];
  ledger: RecentLedger[];
}) {
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case OrderStatus.READY_FOR_DELIVERY:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            Ready
          </span>
        );
      case OrderStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Clock className="h-3 w-3" /> In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Pending
          </span>
        );
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return (
          <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            PAID
          </span>
        );
      case PaymentStatus.PARTIAL:
        return (
          <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            PARTIAL
          </span>
        );
      default:
        return (
          <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
            DUE
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* 1. Recent Service Orders Table (7 cols on xl) */}
      <div className="xl:col-span-7 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 overflow-hidden flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Recent Service Records
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Citizen applications, workflow status, and billing
                </p>
              </div>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
            >
              View All Orders →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              No recent service orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[560px]">
                <thead className="bg-zinc-50/75 border-b border-zinc-150 text-zinc-500 uppercase text-[10px] font-bold tracking-wider dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-400">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Order / Time</th>
                    <th className="py-3.5 px-4 font-semibold">Customer</th>
                    <th className="py-3.5 px-4 font-semibold">Service</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Amount</th>
                    <th className="py-3.5 px-4 text-center font-semibold">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {order.orderNumber}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {order.customerName}
                        </div>
                        {order.customerPhone && (
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {order.customerPhone}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-[160px] truncate">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate block">
                          {order.serviceName}
                        </span>
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(order.status)}</td>

                      <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatCurrency(order.totalAmount)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {getPaymentBadge(order.paymentStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 2. Recent Ledger Audit Trail Table (5 cols on xl) */}
      <div className="xl:col-span-5 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 overflow-hidden flex flex-col justify-between">
        <div>
          <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Cash Ledger Audit
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Live double-entry inflows & outflows
                </p>
              </div>
            </div>
            <Link
              href="/ledger"
              className="text-xs font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
            >
              Full Ledger →
            </Link>
          </div>

          {ledger.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              No recent ledger entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap min-w-[460px]">
                <thead className="bg-zinc-50/75 border-b border-zinc-150 text-zinc-500 uppercase text-[10px] font-bold tracking-wider dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-400">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Entry / Time</th>
                    <th className="py-3.5 px-4 font-semibold">Description</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Amount (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                  {ledger.map((entry) => {
                    const isInflow = entry.direction === "INFLOW";
                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                            {entry.entryNumber}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {formatDateTime(entry.createdAt)}
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-[200px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                                isInflow
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              }`}
                            >
                              {isInflow ? (
                                <ArrowDownLeft className="h-2.5 w-2.5" />
                              ) : (
                                <ArrowUpRight className="h-2.5 w-2.5" />
                              )}
                            </span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                              {entry.note}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 pl-5.5">
                            {entry.accountName}
                          </div>
                        </td>

                        <td
                          className={`py-3 px-4 text-right font-bold font-mono ${
                            isInflow
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isInflow ? "+" : "-"}
                          {formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
