import React from "react";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Store, ShieldCheck, FileCheck, Banknote, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | SmartStationery & Accounts",
  description: "Sign in to manage computer stationary sales, citizen services, customer CRM, and ledger accounts.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 transition-colors duration-200 relative">
      {/* Top Bar Floating Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-zinc-200/90 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/60">
        
        {/* Left Side: Brand & Feature Showcase (Deep Classic Obsidian) */}
        <div className="lg:col-span-5 bg-zinc-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-850">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 text-xs font-semibold uppercase tracking-wider text-zinc-300 border border-zinc-800">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Accounts & Citizen Services</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner">
                  <Store className="h-6 w-6 text-zinc-100" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">SmartStationery</h1>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Integrated shop business management, citizen identity service applications, and real-time virtual cash ledger.
              </p>
            </div>

            <div className="space-y-3.5 pt-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2.5">
                <FileCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>NID, Birth Certificate & Passport Tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Banknote className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Double-Entry Virtual Cash & Drawer Ledger</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Strict RBAC with Granular Permission Checks</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-zinc-850 text-[11px] text-zinc-500">
            Enterprise Shop Accounting System • Modern Web App
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white dark:bg-zinc-950">
          <div className="mb-6 space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Enter your credentials to access the business management terminal.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
