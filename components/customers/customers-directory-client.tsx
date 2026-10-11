"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { CustomerCardActions } from "@/components/customers/customer-card-actions";
import { CollectDueModal } from "@/components/customers/collect-due-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { AuthUser } from "@/lib/auth/session";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, Filter, RotateCcw, Users, Phone, CreditCard, Sparkles, AlertCircle } from "lucide-react";

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  nidNumber: string | null;
  birthRegNumber: string | null;
  profilePhotoUrl?: string | null;
  profilePhotoKey?: string | null;
  currentDue: number;
  advanceBalance: number;
  createdAt: Date;
  _count: {
    serviceOrders: number;
  };
}

interface CustomersDirectoryClientProps {
  customers: CustomerItem[];
  user: AuthUser;
}

export function CustomersDirectoryClient({
  customers,
  user,
}: CustomersDirectoryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.toLowerCase().includes(q);
        const matchesNid = c.nidNumber?.toLowerCase().includes(q);
        const matchesBirth = c.birthRegNumber?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);

        if (!matchesName && !matchesPhone && !matchesNid && !matchesBirth && !matchesEmail) {
          return false;
        }
      }

      // Balance filter
      if (balanceFilter === "DUE" && c.currentDue <= 0) return false;
      if (balanceFilter === "ADVANCE" && c.advanceBalance <= 0) return false;
      if (balanceFilter === "SETTLED" && (c.currentDue > 0 || c.advanceBalance > 0)) {
        return false;
      }

      return true;
    });
  }, [customers, searchTerm, balanceFilter]);

  // Pagination logic
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchTerm("");
    setBalanceFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar with Radix UI Controls */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input using Radix/Tailwind Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer name, mobile phone, NID, or birth registration #..."
              className="pl-10 h-10 text-xs"
            />
          </div>

          {/* Radix UI Dropdown for Filter */}
          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select
                value={balanceFilter}
                onValueChange={(val) => {
                  setBalanceFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <SelectValue placeholder="All Customers" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Customers</SelectItem>
                  <SelectItem value="DUE">Outstanding Due (৳ &gt; 0)</SelectItem>
                  <SelectItem value="ADVANCE">Advance Balance (৳ &gt; 0)</SelectItem>
                  <SelectItem value="SETTLED">Settled Accounts (৳ 0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || balanceFilter !== "ALL") && (
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
        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-850">
          <span>
            Found <span className="font-bold text-zinc-900 dark:text-zinc-100">{filteredCustomers.length}</span> citizen client(s)
          </span>
          {customers.length !== filteredCustomers.length && (
            <span className="font-medium text-zinc-600 dark:text-zinc-400">
              Filtered from {customers.length} total
            </span>
          )}
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        {paginatedCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <Users className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                No customer profiles match your search criteria
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1 text-xs text-zinc-900 hover:underline dark:text-zinc-100 font-medium"
              >
                Reset search filters
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[760px]">
              <thead className="bg-zinc-50/75 border-b border-zinc-150 text-zinc-500 uppercase text-[10px] font-bold tracking-wider dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Contact & Identifiers</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Services</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Advance Balance</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Outstanding Due</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {paginatedCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* Customer Name & Initial / Profile Photo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {c.profilePhotoUrl ? (
                          <img
                            src={c.profilePhotoUrl}
                            alt={c.name}
                            className="h-9 w-9 shrink-0 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 font-bold border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 text-xs font-mono">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                            {c.name}
                          </span>
                          {c.email && (
                            <span className="text-[11px] text-zinc-400 block truncate">
                              {c.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone & NID/BRIS Identifiers */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                          <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {c.nidNumber && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium">
                              NID: {c.nidNumber}
                            </span>
                          )}
                          {c.birthRegNumber && (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium">
                              BRIS: {c.birthRegNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Service Orders Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-850 dark:text-zinc-300">
                        {c._count.serviceOrders} orders
                      </span>
                    </td>

                    {/* Advance Balance */}
                    <td className="py-3 px-4 text-right">
                      {c.advanceBalance > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <Sparkles className="h-3 w-3" />
                          {formatCurrency(c.advanceBalance)}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-mono">৳0.00</span>
                      )}
                    </td>

                    {/* Outstanding Due */}
                    <td className="py-3 px-4 text-right">
                      {c.currentDue > 0 ? (
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(c.currentDue)}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-mono">৳0.00</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <CollectDueModal customer={c as any} />
                        <CustomerCardActions customer={c as any} user={user} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {totalItems > 0 && (
          <div className="border-t border-zinc-150 dark:border-zinc-850 p-3 sm:p-4">
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
