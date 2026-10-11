"use client";

import React, { useState, useTransition, useMemo } from "react";
import { updateUserAction } from "@/actions/user-actions";
import {
  PERMISSION_GROUPS,
  STAFF_DEFAULT_PERMISSIONS,
  ADMIN_DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS,
} from "@/lib/auth/permissions-meta";
import { Permission, RoleType } from "@prisma/client";
import {
  Pencil,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Search,
  User,
  Shield,
  Phone,
  Mail,
  RotateCcw,
  UserCog,
  Check,
  Activity,
  SlidersHorizontal,
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

const STATUS_OPTIONS: SearchableSelectOption[] = [
  {
    value: "active",
    label: "Active Account",
    badge: "Permitted",
    description: "Staff member can log in and execute operations",
  },
  {
    value: "inactive",
    label: "Suspended / Inactive",
    badge: "Locked",
    description: "Account access revoked; cannot log into system",
  },
];

interface EditUserModalProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    roleType: RoleType;
    roleName?: string;
    isActive: boolean;
    permissions: Permission[];
    avatarUrl?: string | null;
    avatarKey?: string | null;
  };
  currentUserId: string;
}

export function EditUserModal({ user, currentUserId }: EditUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isSelf = user.id === currentUserId;

  // Form states
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || "");
  const [password, setPassword] = useState("");
  const [roleType, setRoleType] = useState<RoleType>(user.roleType);
  const [isActive, setIsActive] = useState(user.isActive);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [avatarKey, setAvatarKey] = useState<string | null>(user.avatarKey || null);
  const [permSearch, setPermSearch] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<Permission>>(
    new Set(user.permissions)
  );

  const resetForm = () => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || "");
    setPassword("");
    setRoleType(user.roleType);
    setIsActive(user.isActive);
    setAvatarUrl(user.avatarUrl || null);
    setAvatarKey(user.avatarKey || null);
    setSelectedPerms(new Set(user.permissions));
    setPermSearch("");
    setError(null);
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

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

  // Toggle individual permission
  const togglePermission = (perm: Permission) => {
    const next = new Set(selectedPerms);
    if (next.has(perm)) {
      next.delete(perm);
    } else {
      next.add(perm);
    }
    setSelectedPerms(next);
  };

  // Toggle whole category
  const toggleCategory = (perms: Permission[]) => {
    const next = new Set(selectedPerms);
    const allSelected = perms.every((p) => next.has(p));
    if (allSelected) {
      perms.forEach((p) => next.delete(p));
    } else {
      perms.forEach((p) => next.add(p));
    }
    setSelectedPerms(next);
  };

  // Apply Role Presets
  const applyPreset = (preset: "STAFF" | "ADMIN" | "ALL" | "NONE") => {
    if (preset === "STAFF") {
      setRoleType(RoleType.STAFF);
      setSelectedPerms(new Set(STAFF_DEFAULT_PERMISSIONS));
    } else if (preset === "ADMIN") {
      setRoleType(RoleType.ADMIN);
      setSelectedPerms(new Set(ADMIN_DEFAULT_PERMISSIONS));
    } else if (preset === "ALL") {
      setSelectedPerms(new Set(ALL_PERMISSIONS));
    } else if (preset === "NONE") {
      setSelectedPerms(new Set());
    }
  };

  // Filter permission groups based on search input
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("userId", user.id);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    if (password) formData.append("password", password);
    formData.append("roleType", roleType);
    formData.append("isActive", isActive ? "true" : "false");
    formData.append("avatarUrl", avatarUrl || "");
    formData.append("avatarKey", avatarKey || "");

    // Append permissions
    if (roleType === RoleType.SUPER_ADMIN) {
      ALL_PERMISSIONS.forEach((p) => formData.append("permissions", p));
    } else {
      selectedPerms.forEach((p) => formData.append("permissions", p));
    }

    startTransition(async () => {
      const res = await updateUserAction(null, formData);
      if (res.success) {
        setIsOpen(false);
      } else {
        setError(res.error || "Failed to update member.");
      }
    });
  };

  const isSuperAdminRole = roleType === RoleType.SUPER_ADMIN;

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white transition active:scale-95 cursor-pointer"
        title="Edit member access, role, and permissions"
      >
        <Pencil className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
        <span>Edit Access</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto text-left" dir="ltr">
          {/* Horizontally expansive modal container */}
          <div className="w-full max-w-5xl rounded-3xl border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-925 my-auto max-h-[92vh] flex flex-col overflow-hidden text-left" dir="ltr">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-zinc-900 to-zinc-750 text-white font-extrabold text-sm dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-950 shadow-md">
                    {name.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                      isActive ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                      Edit Staff Access & Profile
                    </h3>
                    {isSelf ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        Current Session
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {roleType.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Configure profile information, credentials, and granular permission rights for{" "}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{name}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Form with Horizontal Multi-Column Layout */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col text-left" dir="ltr">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
                
                {/* Left Column: Profile & Credentials (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4.5 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-200/70 dark:border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Account Profile & Authentication
                        </h4>
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                        ID: {user.id.slice(-6)}
                      </span>
                    </div>

                    {/* Profile Photo Upload to Cloudflare R2 */}
                    <ImageUpload
                      label="Profile Picture"
                      urlFieldName="avatarUrl"
                      keyFieldName="avatarKey"
                      initialUrl={avatarUrl}
                      initialKey={avatarKey}
                      folder="users"
                      fallbackInitial={name || "U"}
                      onChange={({ url, key }) => {
                        setAvatarUrl(url);
                        setAvatarKey(key);
                      }}
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
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
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
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
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
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="017XXXXXXXX"
                          className="pl-9.5 h-9.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Password Reset */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-250 mb-1.5">
                        Reset Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Leave blank to keep current password"
                          minLength={6}
                          className="pl-9.5 h-9.5 text-xs"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                        Only fill if you need to reset this member&apos;s password.
                      </p>
                    </div>

                    {/* Assigned Role Tier with Radix Searchable Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-250 mb-1.5">
                        Assigned Role Tier <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={ROLE_OPTIONS}
                        value={roleType}
                        onValueChange={handleRoleChange}
                        disabled={isSelf}
                        placeholder="Select role tier..."
                        searchPlaceholder="Filter role tiers..."
                      />
                      {isSelf && (
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                          You cannot modify your own role tier.
                        </p>
                      )}
                    </div>

                    {/* Account Status with Radix Searchable Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-750 dark:text-zinc-250 mb-1.5">
                        Account Status <span className="text-rose-500">*</span>
                      </label>
                      <SearchableSelect
                        options={STATUS_OPTIONS}
                        value={isActive ? "active" : "inactive"}
                        onValueChange={(val) => setIsActive(val === "active")}
                        disabled={isSelf}
                        placeholder="Select account status..."
                        searchPlaceholder="Filter account status..."
                      />
                      {isSelf && (
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                          You cannot deactivate your own active session.
                        </p>
                      )}
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
                            {isSuperAdminRole
                              ? "Root Bypass"
                              : `${selectedPerms.size} / ${ALL_PERMISSIONS.length}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {isSuperAdminRole
                            ? "Super Administrator bypasses all permission restrictions"
                            : "Grant or revoke specific functional capabilities for this user"}
                        </p>
                      </div>

                      {/* Quick Preset Buttons */}
                      {!isSuperAdminRole && (
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

                    {isSuperAdminRole ? (
                      /* Super Admin Unrestricted Banner */
                      <div className="rounded-2xl border border-amber-300/80 bg-linear-to-br from-amber-50 to-orange-50/50 p-5 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-orange-950/10 text-xs space-y-2 shadow-xs text-left" dir="ltr">
                        <div className="flex items-center gap-2.5 font-bold text-amber-900 dark:text-amber-200 text-sm text-left">
                          <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 shrink-0">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <span>Unrestricted Root Administrator</span>
                        </div>
                        <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed text-left text-wrap">
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
                                      onClick={() => toggleCategory(groupPermIds)}
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
                  Permissions and role changes update the active session immediately.
                </span>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleClose}
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
                    <span>Save Changes</span>
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
