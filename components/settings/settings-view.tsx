"use client";

import React, { useState, useActionState } from "react";
import { AuthUser } from "@/lib/auth/session";
import {
  changePasswordAction,
  updateMyProfileAction,
  PasswordChangeResult,
  ProfileUpdateResult,
} from "@/actions/auth-actions";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  User,
  Lock,
  Store,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";

interface SettingsViewProps {
  user: AuthUser;
}

export function SettingsView({ user }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "shop" | "preferences">("profile");

  // Profile update state
  const [profileState, profileFormAction, isProfilePending] = useActionState(
    async (prev: ProfileUpdateResult | null, formData: FormData) => {
      return await updateMyProfileAction(prev, formData);
    },
    null
  );

  // Password change state
  const [passwordState, passwordFormAction, isPasswordPending] = useActionState(
    async (prev: PasswordChangeResult | null, formData: FormData) => {
      const res = await changePasswordAction(prev, formData);
      return res;
    },
    null
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span>Account & Business Settings</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
            {user.roleType === "SUPER_ADMIN" ? "Super Admin" : "Staff"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your personal operator profile, change admin credentials, and customize shop preferences.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "profile"
              ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <User className="h-4 w-4" />
          <span>My Profile & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shop")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "shop"
              ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Shop & Invoice Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "preferences"
              ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>General Preferences</span>
        </button>
      </div>

      {/* Tab 1: Profile & Password */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Profile Details Card */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-extrabold text-sm shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                  Operator Profile Details
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Update your display name, contact phone, and avatar
                </p>
              </div>
            </div>

            {profileState?.error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{profileState.error}</span>
              </div>
            )}

            {profileState?.success && (
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{profileState.message}</span>
              </div>
            )}

            <form action={profileFormAction} className="space-y-4">
              {/* Profile Picture Upload with R2 */}
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40">
                <ImageUpload
                  label="Profile Picture"
                  urlFieldName="avatarUrl"
                  keyFieldName="avatarKey"
                  initialUrl={user.avatarUrl}
                  folder="users"
                  fallbackInitial={user.name}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={user.name}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email Address (Login ID)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-100 p-2.5 sm:p-3 text-xs sm:text-sm text-zinc-500 font-mono dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400 cursor-not-allowed"
                  />
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Email identifier is linked to your login session and RBAC access tier.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Mobile Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={user.phone || ""}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProfilePending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition disabled:opacity-50"
                >
                  {isProfilePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-extrabold text-sm shadow-sm">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                  Security & Change Password
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Update your master operator password with strict verification
                </p>
              </div>
            </div>

            {passwordState?.error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{passwordState.error}</span>
              </div>
            )}

            {passwordState?.success && (
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{passwordState.message}</span>
              </div>
            )}

            <form action={passwordFormAction} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Current Password *
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  New Password * (Min 6 Characters)
                </label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={6}
                  placeholder="Enter new strong password"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  placeholder="Re-type new password to confirm"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPasswordPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 active:scale-95 transition disabled:opacity-50"
                >
                  {isPasswordPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Update Master Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Shop & Invoice Profile */}
      {activeTab === "shop" && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-extrabold text-sm shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Shop Business Profile & Invoice Header
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Information appearing on customer receipts, challan tokens, and billing printouts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Business Legal / Shop Name
              </label>
              <input
                type="text"
                defaultValue="SmartStationery & Citizen Online Services"
                className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Counter Helpline / WhatsApp
              </label>
              <input
                type="tel"
                defaultValue="+880 1700-000000"
                className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm font-mono outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Shop Physical Address (Printed on Invoices)
              </label>
              <input
                type="text"
                defaultValue="Holding 42, Road 7, Dhanmondi, Dhaka-1205, Bangladesh"
                className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Receipt / Invoice Footer Note
              </label>
              <textarea
                rows={2}
                defaultValue="Thank you for choosing SmartStationery! Official government fees & printed documents are non-refundable after delivery."
                className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 text-xs sm:text-sm outline-none focus:border-zinc-900 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400 transition"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: General Preferences */}
      {activeTab === "preferences" && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-extrabold text-sm shadow-sm">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Application Preferences & Display
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure currency display, table density, and printing defaults
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div>
                <span className="font-bold text-zinc-900 dark:text-white block">
                  Currency Symbol & Formatting
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Default currency format across orders, ledgers and reports
                </span>
              </div>
              <span className="font-mono font-bold px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                BDT (৳)
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div>
                <span className="font-bold text-zinc-900 dark:text-white block">
                  Auto-Open Print Preview After Order Finalization
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Automatically launches browser print modal for instant receipt generation
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div>
                <span className="font-bold text-zinc-900 dark:text-white block">
                  Timezone & Locale
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  Asia/Dhaka (UTC+6) standard timestamp formatting
                </span>
              </div>
              <span className="font-mono font-medium px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                UTC+06:00
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
