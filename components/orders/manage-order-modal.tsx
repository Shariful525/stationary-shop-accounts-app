"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrderStatusAction,
  collectDuePaymentAction,
  deleteOrderAndRefundAction,
} from "@/actions/order-actions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  OrderStatus,
  PaymentStatus,
  Permission,
} from "@prisma/client";
import {
  Sliders,
  X,
  CheckCircle2,
  Clock,
  Trash2,
  Wallet,
  AlertCircle,
  Loader2,
  Check,
  FileCheck2,
} from "lucide-react";
import { AuthUser } from "@/lib/auth/session";
import { OrderInvoiceModal } from "@/components/orders/order-invoice-modal";

interface CustomFieldValue {
  fieldId: string;
  label: string;
  value: string;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    nidNumber?: string | null;
    birthRegNumber?: string | null;
    currentDue: number;
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
  customValues: CustomFieldValue[];
  notes: string | null;
  createdAt: Date;
  servedBy?: {
    name: string;
  } | null;
}

const WORKFLOW_STAGES = [
  { status: OrderStatus.PENDING, label: "Pending Intake" },
  { status: OrderStatus.IN_PROGRESS, label: "Processing / Form Fill" },
  { status: OrderStatus.AWAITING_GOVT_DOC, label: "Awaiting Govt Portal" },
  { status: OrderStatus.READY_FOR_DELIVERY, label: "Ready for Pickup" },
  { status: OrderStatus.COMPLETED, label: "Delivered & Done" },
  { status: OrderStatus.CANCELLED, label: "Cancelled" },
];

export function ManageOrderModal({
  order,
  user,
}: {
  order: OrderData;
  user: AuthUser;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"workflow" | "due" | "delete">("workflow");

  // Workflow update state
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Financial state
  const [currentPaidAmount, setCurrentPaidAmount] = useState<number>(order.paidAmount);
  const [currentDueAmount, setCurrentDueAmount] = useState<number>(order.dueAmount);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);

  // Due collection state
  const [duePayAmount, setDuePayAmount] = useState<number>(order.dueAmount);
  const [isCollectingDue, setIsCollectingDue] = useState(false);
  const [dueError, setDueError] = useState<string | null>(null);

  // Delete/refund state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleUpdateWorkflow = async (newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    setStatusMessage(null);

    const res = await updateOrderStatusAction(order.id, newStatus);
    setIsUpdatingStatus(false);

    if (res.success) {
      setSelectedStatus(newStatus);
      setStatusMessage(`Status updated to ${newStatus}`);
      router.refresh();
    } else {
      setStatusMessage(res.error || "Failed to update status.");
    }
  };

  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duePayAmount <= 0) return;

    setIsCollectingDue(true);
    setDueError(null);

    const res = await collectDuePaymentAction(order.customer.id, duePayAmount, order.id);
    setIsCollectingDue(false);

    if (res.success) {
      const newPaid = currentPaidAmount + duePayAmount;
      const newDue = Math.max(0, currentDueAmount - duePayAmount);
      setCurrentPaidAmount(newPaid);
      setCurrentDueAmount(newDue);
      setCurrentPaymentStatus(newDue === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL);
      setActiveTab("workflow");
      router.refresh();
    } else {
      setDueError(res.error || "Failed to collect due.");
    }
  };

  const handleDeleteAndRefund = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteOrderAndRefundAction(order.id);
    setIsDeleting(false);

    if (res.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete order.");
    }
  };

  const invoiceOrderData = {
    ...order,
    paidAmount: currentPaidAmount,
    dueAmount: currentDueAmount,
    status: selectedStatus,
    paymentStatus: currentPaymentStatus,
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition active:scale-95"
        title="Manage application workflow & status"
      >
        <Sliders className="h-3.5 w-3.5 text-zinc-500" />
        <span>Manage</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl sm:rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 my-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm font-extrabold text-sm">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
                    Manage Order #{order.orderNumber}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {order.customer.name} ({order.customer.phone}) • {formatDateTime(order.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <OrderInvoiceModal order={invoiceOrderData} />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Financial Status Summary Banner */}
              <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Total Bill</span>
                  <span className="font-extrabold text-zinc-900 dark:text-white font-mono text-sm">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Paid Amount</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                    {formatCurrency(currentPaidAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block mb-0.5">Due Balance</span>
                  <span className={currentDueAmount > 0 ? "font-extrabold text-rose-600 dark:text-rose-400 font-mono text-sm" : "font-semibold text-zinc-400 font-mono text-sm"}>
                    {formatCurrency(currentDueAmount)}
                  </span>
                </div>
              </div>

              {/* Dynamic Custom Fields Captured */}
              {order.customValues && order.customValues.length > 0 && (
                <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block mb-1.5">
                    Citizen Service Data:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {order.customValues.map((cv, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-medium">{cv.label}:</span>
                        <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {cv.value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("workflow")}
                  className={`pb-2.5 px-3 border-b-2 transition ${
                    activeTab === "workflow"
                      ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  1. Workflow Stages
                </button>
                {currentDueAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("due")}
                    className={`pb-2.5 px-3 border-b-2 transition ${
                      activeTab === "due"
                        ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    }`}
                  >
                    2. Collect Due (৳{currentDueAmount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab("delete")}
                  className={`pb-2.5 px-3 border-b-2 transition ${
                    activeTab === "delete"
                      ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  3. Cancel & Refund
                </button>
              </div>

              {/* Tab 1: Workflow Management */}
              {activeTab === "workflow" && (
                <div className="pt-2 space-y-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                    Update order processing stage:
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {WORKFLOW_STAGES.map((ws) => {
                      const isCurrent = selectedStatus === ws.status;
                      return (
                        <button
                          key={ws.status}
                          type="button"
                          onClick={() => handleUpdateWorkflow(ws.status)}
                          disabled={isUpdatingStatus}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-bold transition active:scale-95 ${
                            isCurrent
                              ? "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950 dark:border-white"
                              : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                          }`}
                        >
                          <span>{ws.label}</span>
                          {isCurrent && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })}
                  </div>

                  {statusMessage && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>{statusMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Collect Due Payment */}
              {activeTab === "due" && (
                <form onSubmit={handleCollectDue} className="pt-2 space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 text-xs border border-amber-200/80 dark:border-amber-900">
                    Customer currently owes <strong>{formatCurrency(currentDueAmount)}</strong> on this order. Enter counter cash received.
                  </div>

                  {dueError && (
                    <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{dueError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                      Amount Received (৳ BDT) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={currentDueAmount}
                      required
                      value={duePayAmount}
                      onChange={(e) => setDuePayAmount(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-base font-extrabold font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400 transition"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("workflow")}
                      className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCollectingDue}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition disabled:opacity-50"
                    >
                      {isCollectingDue && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Collect ৳{duePayAmount}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 3: Cancel Order & Refund Customer */}
              {activeTab === "delete" && (
                <div className="pt-2 space-y-4">
                  <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200 text-xs space-y-2">
                    <h4 className="font-extrabold flex items-center gap-1.5 text-sm text-rose-700 dark:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                      Cancel Order & Customer Refund Policy
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                      {order.paidAmount > 0 && (
                        <li>
                          <strong>{formatCurrency(order.paidAmount)}</strong> already paid by the customer will be <strong>refunded from the Cash Drawer</strong> and logged in the ledger audit trail.
                        </li>
                      )}
                      {order.dueAmount > 0 && (
                        <li>
                          Outstanding due of <strong>{formatCurrency(order.dueAmount)}</strong> will be cleared from customer <strong className="font-semibold">{order.customer.name}</strong>.
                        </li>
                      )}
                      <li>The order record will be permanently deleted.</li>
                    </ul>
                  </div>

                  {deleteError && (
                    <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{deleteError}</span>
                    </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("workflow")}
                      className="w-full sm:w-auto rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAndRefund}
                      disabled={isDeleting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition disabled:opacity-50"
                    >
                      {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Confirm Refund & Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
