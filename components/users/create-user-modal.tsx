"use client";

import React, { useActionState, useState, useMemo } from "react";
import { createUserAction, UserActionResult } from "@/actions/user-actions";
import {
  PERMISSION_GROUPS,
  STAFF_DEFAULT_PERMISSIONS,
  ADMIN_DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS,
} from "@/lib/auth/permissions-meta";
import { Permission, RoleType } from "@prisma/client";
import {
  UserPlus,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Search,
  CheckCheck,
  RotateCcw,
  Sparkles,
  Lock,
  User,
  Phone,
  Mail,
  KeyRound,
  Shield,
  UserCog,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select";

const ROLE_OPTIONS: SearchableSelectOption[] = [
  {
    value: RoleType.STAFF,
    label: "Staff Operator",
    badge: "Counter Staff",
    description: "Daily counter service intake, orders, and printing jobs",
  },
  {
    value: RoleType.ADMIN,
    label: "Administrator",
    badge: "Shop Manager",
    description: "Inventory, customer profiles, expense tracking, and reports",
  },
  {
    value: RoleType.CUSTOM,
    label: "Custom Access",
    badge: "Selective RBAC",
    description: "Granular custom permissions configured for specific duties",
  },
  {
    value: RoleType.SUPER_ADMIN,
    label: "Super Administrator",
    badge: "Root Control",
    description: "Full unrestricted access across all financial & admin modules",
  },
];

export function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [roleType, setRoleType] = useState<RoleType>(RoleType.STAFF);
  const [permSearch, setPermSearch] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<Permission>>(
    new Set(STAFF_DEFAULT_PERMISSIONS)
  );

  const [state, formAction, isPending] = useActionState(
    async (prev: UserActionResult | null, formData: FormData) => {
      // Ensure roleType is explicitly in formData
      formData.set("roleType", roleType);

      // Append selected permissions
      if (roleType === RoleType.SUPER_ADMIN) {
        ALL_PERMISSIONS.forEach((p) => formData.append("permissions", p));
      } else {
        selectedPerms.forEach((p) => formData.append("permissions", p));
      }

      const res = await createUserAction(prev, formData);
      if (res.success) {
        setIsOpen(false);
        setUserName("");
        setRoleType(RoleType.STAFF);
        setSelectedPerms(new Set(STAFF_DEFAULT_PERMISSIONS));
        setPermSearch("");
      }
      return res;
    },
    null
  );

  const handleRoleChange = (newRoleVal: string) => {
    const newRole = newRoleVal as RoleType;
    setRoleType(newRole);
    if (newRole === RoleType.STAFF) {
      setSelectedPerms(new Set(STAFF_DEFAULT_PERMISSIONS));
    } else if (newRole === RoleType.ADMIN) {
      setSelectedPerms(new Set(ADMIN_DEFAULT_PERMISSIONS));
    } else if (newRole === RoleType.SUPER_ADMIN) {
      setSelectedPerms(new Set(ALL_PERMISSIONS));
    }
  };

  const togglePermission = (perm: Permission) => {
    const next = new Set(selectedPerms);
    if (next.has(perm)) {
      next.delete(perm);
    } else {
      next.add(perm);
    }
    setSelectedPerms(next);
  };

  const applyPreset = (preset: "ALL" | "NONE" | "STAFF" | "ADMIN") => {
    if (preset === "ALL") {
      setSelectedPerms(new Set(ALL_PERMISSIONS));
    } else if (preset === "NONE") {
      setSelectedPerms(new Set());
    } else if (preset === "STAFF") {
      setSelectedPerms(new Set(STAFF_DEFAULT_PERMISSIONS));
    } else if (preset === "ADMIN") {
      setSelectedPerms(new Set(ADMIN_DEFAULT_PERMISSIONS));
    }
  };

  // Filter permission groups based on search
  const filteredGroups = useMemo(() => {
    if (!permSearch.trim()) return PERMISSION_GROUPS;
    const q = permSearch.toLowerCase();
    return PERMISSION_GROUPS.map((group) => {
      const matchingPerms = group.permissions.filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          group.name.toLowerCase().includes(q)
      );
      return {
        ...group,
        permissions: matchingPerms,
      };
    }).filter((group) => group.permissions.length > 0);
  }, [permSearch]);

  const isSuperAdmin = roleType === RoleType.SUPER_ADMIN;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition cursor-pointer"
      >
        <UserPlus className="h-4 w-4" />
        <span>Add Staff Member</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto text-left" dir="ltr">
          {/* Horizontally expansive modal container */}
          <div className="w-full max-w-5xl rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-925 my-auto max-h-[92vh] flex flex-col overflow-hidden text-left" dir="ltr">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-750 text-white dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-950 shadow-md">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                    Add Team Operator
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Configure operator profile, credentials, and granular permission rights
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {state?.error && (
              <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Modal Form with Horizontal Multi-Column Layout */}
            <form action={formAction} className="flex-1 overflow-y-auto p-6 flex flex-col text-left" dir="ltr">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
                
                {/* Left Column: Profile & Credentials (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4.5 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Operator Account Details
                        </h4>
                      </div>
                    </div>

                    {/* Profile Picture Upload to Cloudflare R2 */}
                    <ImageUpload
                      label="Profile Picture"
                      urlFieldName="avatarUrl"
                      keyFieldName="avatarKey"
                      folder="users"
                      fallbackInitial={userName || "U"}
                    />

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-250 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                        <Input
                          type="text"
                          name="name"
                          required
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="e.g. Tariqul Islam"
                          className="pl-9.5 h-9.5 text-xs"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-250 mb-1.5">
                        Email Address (Login ID) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                        <Input
                          type="email"
                          name="email"
                          required
                          placeholder="operator@smartstationery.com"
                          className="pl-9.5 h-9.5 text-xs"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-250 mb-1.5">
                        Mobile Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                        <Input
                          type="tel"
                          name="phone"
                          placeholder="017XXXXXXXX"
                          className="pl-9.5 h-9.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-250 mb-1.5">
                        Account Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                        <Input
                          type="password"
                          name="password"
                          required
                          minLength={6}
                          placeholder="Minimum 6 characters"
                          className="pl-9.5 h-9.5 text-xs"
                        />
                      </div>
                    </div>

                    {/* Assigned Role Tier with Radix Searchable Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-250 mb-1.5">
                        Assigned Role Tier <span className="text-rose-500">*</span>
                      </label>
                      <input type="hidden" name="roleType" value={roleType} />
                      <SearchableSelect
                        options={ROLE_OPTIONS}
                        value={roleType}
                        onValueChange={handleRoleChange}
                        placeholder="Select role tier..."
                        searchPlaceholder="Filter role options..."
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Granular Permissions Matrix (7 Cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-3">
                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4.5 dark:border-zinc-800 dark:bg-zinc-950/40 flex-1 flex flex-col space-y-3.5">
                    
                    {/* Permissions Header & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-200/70 dark:border-zinc-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            Granular Access Rights
                          </h4>
                          <span className="inline-flex items-center rounded-full bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                            {isSuperAdmin
                              ? "Root Bypass"
                              : `${selectedPerms.size} / ${ALL_PERMISSIONS.length}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {isSuperAdmin
                            ? "Super Administrator bypasses all permission restrictions"
                            : "Configure granted functional modules for this account"}
                        </p>
                      </div>

                      {/* Quick Preset Buttons */}
                      {!isSuperAdmin && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => applyPreset("STAFF")}
                            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition cursor-pointer"
                          >
                            Staff Preset
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset("ADMIN")}
                            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition cursor-pointer"
                          >
                            Admin Preset
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset("ALL")}
                            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition cursor-pointer"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPreset("NONE")}
                            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 transition cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {isSuperAdmin ? (
                      /* Super Admin Unrestricted Banner */
                      <div className="rounded-2xl border border-amber-300/80 bg-linear-to-br from-amber-50 to-orange-50/50 p-5 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-orange-950/10 text-xs space-y-2 shadow-xs">
                        <div className="flex items-center gap-2.5 font-bold text-amber-900 dark:text-amber-200 text-sm">
                          <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <span>Super Administrator Access</span>
                        </div>
                        <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                          This user tier automatically possesses complete system authority over services, customers, finances, cash registers, audit ledgers, and team members. Individual permission toggles are bypassed.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Permission Search Bar */}
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                          <Input
                            type="text"
                            value={permSearch}
                            onChange={(e) => setPermSearch(e.target.value)}
                            placeholder="Filter permissions... (e.g. orders, delete, expenses, ledger)"
                            className="pl-9 pr-8 text-xs h-9 bg-white dark:bg-zinc-900"
                          />
                          {permSearch && (
                            <button
                              type="button"
                              onClick={() => setPermSearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Scrollable Grouped Permissions List */}
                        <div className="max-h-[430px] overflow-y-auto space-y-3 pr-1">
                          {filteredGroups.length === 0 ? (
                            <div className="py-10 text-center text-xs text-zinc-400 dark:text-zinc-500">
                              No permissions match &ldquo;{permSearch}&rdquo;
                            </div>
                          ) : (
                            filteredGroups.map((group) => {
                              const groupPermIds = group.permissions.map((p) => p.id);
                              const allGroupSelected = groupPermIds.every((id) =>
                                selectedPerms.has(id)
                              );

                              return (
                                <div
                                  key={group.name}
                                  className="rounded-2xl border border-zinc-200/70 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs"
                                >
                                  {/* Group Header */}
                                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
                                    <div>
                                      <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                        {group.name}
                                      </h5>
                                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                        {group.description}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = new Set(selectedPerms);
                                        if (allGroupSelected) {
                                          groupPermIds.forEach((id) => next.delete(id));
                                        } else {
                                          groupPermIds.forEach((id) => next.add(id));
                                        }
                                        setSelectedPerms(next);
                                      }}
                                      className="text-[10px] font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 px-2 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                    >
                                      {allGroupSelected ? "Deselect Group" : "Select Group"}
                                    </button>
                                  </div>

                                  {/* Group Permission Items */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {group.permissions.map((p) => {
                                      const checked = selectedPerms.has(p.id);
                                      return (
                                        <label
                                          key={p.id}
                                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition select-none ${
                                            checked
                                              ? "border-zinc-900/40 bg-zinc-900/[0.04] dark:border-zinc-500/50 dark:bg-white/[0.05] ring-1 ring-zinc-900/10 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                                              : "border-zinc-150 bg-white text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-925 dark:text-zinc-400 dark:hover:border-zinc-700"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => togglePermission(p.id)}
                                            className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-400 cursor-pointer"
                                          />
                                          <div className="min-w-0">
                                            <p className="text-xs font-semibold leading-tight">
                                              {p.label}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5 line-clamp-2">
                                              {p.description}
                                            </p>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="mt-6 pt-4 border-t border-zinc-150 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                  Assigned permissions apply upon the member&apos;s initial system login.
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 sm:flex-none rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-750 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Create Member</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
