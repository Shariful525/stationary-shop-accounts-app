import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200">
      <Sidebar user={user} />
      <div className="lg:pl-72 flex flex-col min-h-screen min-w-0">
        <Header user={user} />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
