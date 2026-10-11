"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { ServiceCardActions } from "@/components/services/service-card-actions";
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
import { Search, Filter, RotateCcw, CheckCircle2, XCircle, Layers, FileText } from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  baseCharge: number;
  govtFee: number;
  costPrice: number;
  isActive: boolean;
  categoryId: string;
  customFields: any[];
  category: {
    id: string;
    name: string;
  } | null;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface ServicesCatalogClientProps {
  services: ServiceItem[];
  categories: CategoryItem[];
  user: AuthUser;
}

export function ServicesCatalogClient({
  services,
  categories,
  user,
}: ServicesCatalogClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesCode = s.code.toLowerCase().includes(q);
        const matchesDesc = s.description?.toLowerCase().includes(q);
        const matchesCat = s.category?.name.toLowerCase().includes(q);

        if (!matchesName && !matchesCode && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "ALL" && s.categoryId !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE" && !s.isActive) return false;
      if (statusFilter === "DISABLED" && s.isActive) return false;

      return true;
    });
  }, [services, searchTerm, categoryFilter, statusFilter]);

  // Pagination logic
  const totalItems = filteredServices.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("ALL");
    setStatusFilter("ALL");
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
              placeholder="Search services by code, service name, description, or category..."
              className="pl-10 h-10 text-xs"
            />
          </div>

          {/* Radix UI Dropdowns for Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <div className="w-44">
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-10 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <SelectValue placeholder="All Categories" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Dropdown */}
            <div className="w-36">
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
                    <SelectValue placeholder="All Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="DISABLED">Disabled Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(searchTerm || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
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
            Found <span className="font-bold text-zinc-900 dark:text-zinc-100">{filteredServices.length}</span> matching service(s)
          </span>
          {services.length !== filteredServices.length && (
            <span className="font-medium text-zinc-600 dark:text-zinc-400">
              Filtered from {services.length} total
            </span>
          )}
        </div>
      </div>

      {/* Services Directory Table */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        {paginatedServices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <Layers className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                No services match your search and filter criteria
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
            <table className="w-full text-left text-xs whitespace-nowrap min-w-[780px]">
              <thead className="bg-zinc-50/75 border-b border-zinc-150 text-zinc-500 uppercase text-[10px] font-bold tracking-wider dark:bg-zinc-900/40 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Service / Code</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Custom Fields</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Shop Fee</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Govt Fee</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Retail Total</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850">
                {paginatedServices.map((service) => {
                  const totalRetail = service.baseCharge + service.govtFee;
                  const customFieldCount = Array.isArray(service.customFields)
                    ? service.customFields.length
                    : 0;

                  return (
                    <tr
                      key={service.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      {/* Service Name & Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[10px] font-bold uppercase bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                            {service.code}
                          </span>
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate max-w-[220px]">
                              {service.name}
                            </span>
                            {service.description && (
                              <span className="text-[11px] text-zinc-400 block truncate max-w-[220px]">
                                {service.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300">
                          {service.category?.name || "General"}
                        </span>
                      </td>

                      {/* Dynamic Custom Fields */}
                      <td className="py-3 px-4 text-center">
                        {customFieldCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            <FileText className="h-3 w-3" />
                            {customFieldCount} fields
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">Standard</span>
                        )}
                      </td>

                      {/* Shop Fee */}
                      <td className="py-3 px-4 text-right font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                        {formatCurrency(service.baseCharge)}
                      </td>

                      {/* Govt Fee */}
                      <td className="py-3 px-4 text-right font-medium text-zinc-700 dark:text-zinc-300 font-mono">
                        {service.govtFee > 0 ? formatCurrency(service.govtFee) : "—"}
                      </td>

                      {/* Retail Total */}
                      <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100 font-mono text-sm">
                        {formatCurrency(totalRetail)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {service.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            <XCircle className="h-3 w-3" /> Disabled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <ServiceCardActions
                            service={service}
                            categories={categories}
                            user={user}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
