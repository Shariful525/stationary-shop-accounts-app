"use client";

import React, { useState, useMemo } from "react";
import { formatDateTime } from "@/lib/utils";
import { EditUserModal } from "@/components/users/edit-user-modal";
import { DeleteUserModal } from "@/components/users/delete-user-modal";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { AuthUser } from "@/lib/auth/session";
import { RoleType, Permission } from "@prisma/client";
import {
  Search,
  Filter,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roleType: RoleType;
  isActive: boolean;
  permissions: Permission[];
  avatarUrl?: string | null;
  avatarKey?: string | null;
  lastLoginAt: Date | null;
  role?: {
    name: string;
  } | null;
}

interface UsersTableClientProps {
  users: UserItem[];
  currentUser: AuthUser;
  isSuperAdmin: boolean;
}

const ROLE_FILTER_OPTIONS: SearchableSelectOption[] = [
  { value: "ALL", label: "All Role Tiers", badge: "All" },
  { value: RoleType.SUPER_ADMIN, label: "Super Administrator", badge: "Root" },
  { value: RoleType.ADMIN, label: "Administrator", badge: "Manager" },
  { value: RoleType.STAFF, label: "Staff Operator", badge: "Counter" },
  { value: RoleType.CUSTOM, label: "Custom Granular Access", badge: "Custom" },
];

const STATUS_FILTER_OPTIONS: SearchableSelectOption[] = [
  { value: "ALL", label: "All Account Statuses", badge: "All" },
  { value: "ACTIVE", label: "Active Members Only", badge: "Active" },
  { value: "DEACTIVATED", label: "Deactivated / Locked", badge: "Blocked" },
];

export function UsersTableClient({
  users,
  currentUser,
  isSuperAdmin,
}: UsersTableClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone?.toLowerCase().includes(q);

        if (!matchesName && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== "ALL" && u.roleType !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE" && !u.isActive) return false;
      if (statusFilter === "DEACTIVATED" && u.isActive) return false;

      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Pagination logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Search & Filter Header Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search personnel by name, email, or mobile phone..."
              className="pl-10 text-xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 w-[200px]">
              <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <SearchableSelect
                options={ROLE_FILTER_OPTIONS}
                value={roleFilter}
                onValueChange={(val) => {
                  setRoleFilter(val);
                  setCurrentPage(1);
                }}
                placeholder="Role Tier"
                searchPlaceholder="Search roles..."
              />
            </div>

            <div className="w-[180px]">
              <SearchableSelect
                options={STATUS_FILTER_OPTIONS}
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                placeholder="Account Status"
                searchPlaceholder="Search status..."
              />
            </div>

            {(searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition"
                title="Reset all filters"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Filter Indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Found <span className="font-bold text-slate-800 dark:text-white">{filteredUsers.length}</span> personnel member(s)
          </span>
          {users.length !== filteredUsers.length && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Filtered from {users.length} total
            </span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-600 uppercase text-[10px] tracking-wider dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
            <tr>
              <th className="py-3 px-4">User Details</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role & Access Tier</th>
              <th className="py-3 px-4">Granular Permissions</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Login</th>
              {isSuperAdmin && (
                <th className="py-3 px-4 text-right">Super Admin Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No team members match your filter criteria
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
              paginatedUsers.map((u) => {
                const isUserSuperAdmin = u.roleType === RoleType.SUPER_ADMIN;
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="h-8 w-8 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-xs dark:bg-zinc-100 dark:text-zinc-950 shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.id === currentUser.id && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded font-normal">
                                You
                              </span>
                            )}
                          </div>
                          {u.phone && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {u.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          isUserSuperAdmin
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
                            : u.roleType === RoleType.ADMIN
                            ? "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                            : u.roleType === RoleType.CUSTOM
                            ? "bg-purple-100 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {isUserSuperAdmin ? (
                          <ShieldCheck className="h-3 w-3 text-amber-600" />
                        ) : (
                          <UserCheck className="h-3 w-3 text-blue-600" />
                        )}
                        {u.roleType === RoleType.SUPER_ADMIN
                          ? "Super Admin"
                          : u.roleType === RoleType.CUSTOM
                          ? "Custom Access"
                          : u.role?.name || u.roleType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {isUserSuperAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                          ⭐ Unrestricted (Full Bypass)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {u.permissions.length}
                          </span>{" "}
                          rules granted
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                          <XCircle className="h-3 w-3" /> Deactivated
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never logged in"}
                    </td>

                    {/* Actions Column: Strictly rendered ONLY for Super Admin */}
                    {isSuperAdmin && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 text-left" dir="ltr">
                          <EditUserModal
                            user={{
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              phone: u.phone,
                              roleType: u.roleType,
                              roleName: u.role?.name,
                              isActive: u.isActive,
                              permissions: u.permissions,
                            }}
                            currentUserId={currentUser.id}
                          />
                          <DeleteUserModal
                            user={{
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              roleType: u.roleType,
                              isActive: u.isActive,
                            }}
                            isCurrentUser={u.id === currentUser.id}
                          />
                        </div>
                      </td>
                    )}
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
