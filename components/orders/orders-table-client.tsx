"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ManageOrderModal } from "@/components/orders/manage-order-modal";
import { OrderInvoiceModal } from "@/components/orders/order-invoice-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { AuthUser } from "@/lib/auth/session";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import {
  Search,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface OrderItem {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customValues: any[];
  deliveryDate: Date | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  customer: {
    id: string;
    name: string;
    phone: string;
    nidNumber: string | null;
    birthRegNumber: string | null;
    currentDue: number;
  };
  service: {
    id?: string;
    name: string;
  };
  servedBy: {
    name: string;
  } | null;
}

interface OrdersTableClientProps {
  orders: OrderItem[];
  user: AuthUser;
}

export function OrdersTableClient({ orders, user }: OrdersTableClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesOrder = order.orderNumber.toLowerCase().includes(q);
        const matchesCustomer =
          order.customer.name.toLowerCase().includes(q) ||
          order.customer.phone.toLowerCase().includes(q);
        const matchesService = order.service.name.toLowerCase().includes(q);
        const matchesNotes = order.notes?.toLowerCase().includes(q);

        if (!matchesOrder && !matchesCustomer && !matchesService && !matchesNotes) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== "ALL" && order.paymentStatus !== paymentFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  // Pagination logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setCurrentPage(1);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case OrderStatus.READY_FOR_DELIVERY:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            Ready For Pickup
          </span>
        );
      case OrderStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="h-3 w-3" /> In Progress
          </span>
        );
      case OrderStatus.AWAITING_GOVT_DOC:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
            Govt Portal Review
          </span>
        );
      case OrderStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Pending
          </span>
        );
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            PAID
          </span>
        );
      case PaymentStatus.PARTIAL:
        return (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            PARTIAL
          </span>
        );
      default:
        return (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            DUE
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
      {/* Search & Filter Header Bar */}
      <div className="p-4 border-b border-zinc-150 dark:border-zinc-850 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by order #, customer name, phone, or service..."
              className="pl-10 h-10 text-xs"
            />
          </div>

          {/* Radix UI Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-48">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <SelectValue placeholder="All Workflow Statuses" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Workflow Statuses</SelectItem>
                  <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={OrderStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={OrderStatus.AWAITING_GOVT_DOC}>Govt Portal Review</SelectItem>
                  <SelectItem value={OrderStatus.READY_FOR_DELIVERY}>Ready For Pickup</SelectItem>
                  <SelectItem value={OrderStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Select
                value={paymentFilter}
                onValueChange={(val) => {
                  setPaymentFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Payments</SelectItem>
                  <SelectItem value={PaymentStatus.PAID}>Paid Full</SelectItem>
                  <SelectItem value={PaymentStatus.PARTIAL}>Partial Payment</SelectItem>
                  <SelectItem value={PaymentStatus.DUE}>Has Due Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || statusFilter !== "ALL" || paymentFilter !== "ALL") && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                title="Reset Filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Filter Indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Found <span className="font-bold text-slate-800 dark:text-white">{filteredOrders.length}</span> matching order(s)
          </span>
          {orders.length !== filteredOrders.length && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Filtered from {orders.length} total
            </span>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-600 uppercase text-[10px] tracking-wider dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4">Order / Date</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Workflow Status</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Due</th>
              <th className="py-3 px-4 text-right">Staff</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCheck2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No service orders match your filter criteria
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Clear search and filter query
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {order.orderNumber}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {order.customer.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {order.customer.phone}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {order.service.name}
                    </div>
                    {order.customValues.length > 0 && (
                      <div className="text-[10px] text-blue-600 dark:text-blue-400">
                        {order.customValues.length} custom value(s) attached
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>

                  <td className="py-3.5 px-4">{getPaymentBadge(order.paymentStatus)}</td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(order.totalAmount)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-medium whitespace-nowrap">
                    {order.dueAmount > 0 ? (
                      <span className="text-rose-600 font-bold">
                        {formatCurrency(order.dueAmount)}
                      </span>
                    ) : (
                      <span className="text-slate-400">৳0.00</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {order.servedBy?.name || "Staff"}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <OrderInvoiceModal order={order as any} />
                      <ManageOrderModal order={order as any} user={user} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        pageSizeOptions={[10, 25, 50]}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
