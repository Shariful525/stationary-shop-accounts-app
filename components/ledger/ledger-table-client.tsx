"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { LedgerDirection, LedgerEntryType } from "@prisma/client";
import {
  Search,
  Filter,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  History,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface LedgerItem {
  id: string;
  entryNumber: string;
  type: LedgerEntryType;
  direction: LedgerDirection;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  note: string;
  createdAt: Date;
  account: {
    name: string;
    type?: string;
  };
  performedBy: {
    name: string;
  };
}

interface LedgerTableClientProps {
  ledgerEntries: LedgerItem[];
}

export function LedgerTableClient({ ledgerEntries }: LedgerTableClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((entry) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesNumber = entry.entryNumber.toLowerCase().includes(q);
        const matchesNote = entry.note.toLowerCase().includes(q);
        const matchesSource = entry.source.toLowerCase().includes(q);
        const matchesUser = entry.performedBy.name.toLowerCase().includes(q);
        const matchesAccount = entry.account.name.toLowerCase().includes(q);

        if (!matchesNumber && !matchesNote && !matchesSource && !matchesUser && !matchesAccount) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "ALL" && entry.type !== typeFilter) {
        return false;
      }

      // Direction filter
      if (directionFilter !== "ALL" && entry.direction !== directionFilter) {
        return false;
      }

      return true;
    });
  }, [ledgerEntries, searchTerm, typeFilter, directionFilter]);

  // Pagination logic
  const totalItems = filteredEntries.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setDirectionFilter("ALL");
    setCurrentPage(1);
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
              placeholder="Search by entry #, audit note, transaction source, or operator name..."
              className="pl-10 h-10 text-xs"
            />
          </div>

          {/* Filter Dropdowns with Radix UI */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-52">
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <SelectValue placeholder="All Transaction Types" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Transaction Types</SelectItem>
                  <SelectItem value={LedgerEntryType.INCOME}>Income (Service Inflows)</SelectItem>
                  <SelectItem value={LedgerEntryType.EXPENSE}>Expense (Shop Outflows)</SelectItem>
                  <SelectItem value={LedgerEntryType.DEPOSIT}>Deposit (Capital Floats)</SelectItem>
                  <SelectItem value={LedgerEntryType.WITHDRAWAL}>Withdrawal (Cash Pulls)</SelectItem>
                  <SelectItem value={LedgerEntryType.ADJUSTMENT}>Adjustment (Reconciliations)</SelectItem>
                  <SelectItem value={LedgerEntryType.TRANSFER}>Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Select
                value={directionFilter}
                onValueChange={(val) => {
                  setDirectionFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="All Flow Directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Flow Directions</SelectItem>
                  <SelectItem value={LedgerDirection.INFLOW}>Inflow (+ Money In)</SelectItem>
                  <SelectItem value={LedgerDirection.OUTFLOW}>Outflow (- Money Out)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || typeFilter !== "ALL" || directionFilter !== "ALL") && (
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
            Found <span className="font-bold text-slate-800 dark:text-white">{filteredEntries.length}</span> matching ledger transaction(s)
          </span>
          {ledgerEntries.length !== filteredEntries.length && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Filtered from {ledgerEntries.length} total
            </span>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-600 uppercase text-[10px] tracking-wider dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4">Entry / Timestamp</th>
              <th className="py-3 px-4">Account</th>
              <th className="py-3 px-4">Transaction Type</th>
              <th className="py-3 px-4">Details / Audit Note</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Balance After</th>
              <th className="py-3 px-4 text-right">Operator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <History className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No ledger transactions match your filter criteria
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
              paginatedEntries.map((entry) => {
                const isInflow = entry.direction === LedgerDirection.INFLOW;
                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {entry.entryNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(entry.createdAt)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {entry.account.name}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          entry.type === LedgerEntryType.INCOME
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : entry.type === LedgerEntryType.EXPENSE
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            : entry.type === LedgerEntryType.DEPOSIT
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : entry.type === LedgerEntryType.WITHDRAWAL
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                            : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                        }`}
                      >
                        {isInflow ? (
                          <ArrowDownLeft className="h-3 w-3" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3" />
                        )}
                        {entry.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="truncate text-slate-800 dark:text-slate-200 font-medium">
                        {entry.note}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Source: {entry.source}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-xs whitespace-nowrap font-mono">
                      <span
                        className={
                          isInflow
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        {isInflow ? "+" : "-"}
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(entry.balanceAfter)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        prev: {formatCurrency(entry.balanceBefore)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium dark:bg-slate-800">
                        <ShieldCheck className="h-3 w-3 text-blue-500" />
                        {entry.performedBy.name}
                      </span>
                    </td>
                  </tr>
                );
              })
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
