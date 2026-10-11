"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { AuthUser } from "@/lib/auth/session";
import { Search, Filter, RotateCcw, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ExpenseItem {
  id: string;
  expenseNumber: string;
  title: string;
  amount: number;
  date: Date;
  note: string | null;
  categoryId: string;
  category: {
    id?: string;
    name: string;
  };
  account: {
    name: string;
  } | null;
  createdBy: {
    name: string;
  };
}

interface CategoryItem {
  id: string;
  name: string;
}

interface ExpensesTableClientProps {
  expenses: ExpenseItem[];
  categories: CategoryItem[];
  user: AuthUser;
}

export function ExpensesTableClient({
  expenses,
  categories,
  user,
}: ExpensesTableClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return expenses.filter((exp) => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesVoucher = exp.expenseNumber.toLowerCase().includes(q);
        const matchesTitle = exp.title.toLowerCase().includes(q);
        const matchesNote = exp.note?.toLowerCase().includes(q);
        const matchesCategory = exp.category.name.toLowerCase().includes(q);
        const matchesUser = exp.createdBy.name.toLowerCase().includes(q);

        if (!matchesVoucher && !matchesTitle && !matchesNote && !matchesCategory && !matchesUser) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "ALL" && exp.categoryId !== categoryFilter) {
        return false;
      }

      // Date preset filter
      if (dateFilter !== "ALL") {
        const expDate = new Date(exp.date);
        if (dateFilter === "TODAY" && expDate < todayStart) return false;
        if (dateFilter === "WEEK" && expDate < weekStart) return false;
        if (dateFilter === "MONTH" && expDate < monthStart) return false;
      }

      return true;
    });
  }, [expenses, searchTerm, categoryFilter, dateFilter]);

  // Pagination logic
  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setDateFilter("ALL");
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
              placeholder="Search by voucher #, title, notes, or staff name..."
              className="pl-10 h-10 text-xs"
            />
          </div>

          {/* Filter Dropdowns with Radix UI */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-48">
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <SelectValue placeholder="All Categories" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories ({categories.length})</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-36">
              <Select
                value={dateFilter}
                onValueChange={(val) => {
                  setDateFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="TODAY">Today Only</SelectItem>
                  <SelectItem value="WEEK">Last 7 Days</SelectItem>
                  <SelectItem value="MONTH">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || categoryFilter !== "ALL" || dateFilter !== "ALL") && (
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
            Found <span className="font-bold text-slate-800 dark:text-white">{filteredExpenses.length}</span> matching record(s)
          </span>
          {expenses.length !== filteredExpenses.length && (
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              Filtered from {expenses.length} total
            </span>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-600 uppercase text-[10px] tracking-wider dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4">Voucher / Date</th>
              <th className="py-3 px-4">Title & Description</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Paid From</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Recorded By</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No expense records match your filter criteria
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
              paginatedExpenses.map((exp) => (
                <tr
                  key={exp.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {exp.expenseNumber}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {formatDateTime(exp.date)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {exp.title}
                    </div>
                    {exp.note && (
                      <div className="text-[11px] text-slate-500 truncate">
                        {exp.note}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {exp.category.name}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    <div>{exp.account?.name || "Shop Cash Drawer"}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">
                      CASH
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap font-mono">
                    -{formatCurrency(exp.amount)}
                  </td>

                  <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {exp.createdBy.name}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <DeleteExpenseButton
                      expenseId={exp.id}
                      expenseNumber={exp.expenseNumber}
                      title={exp.title}
                      amount={exp.amount}
                      user={user}
                    />
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
