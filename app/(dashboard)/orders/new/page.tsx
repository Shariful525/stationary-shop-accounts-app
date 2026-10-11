import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { NewOrderForm } from "@/components/orders/new-order-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewOrderPage() {
  await requireAuth();

  const [customers, services, accounts] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, advanceBalance: true, currentDue: true },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        baseCharge: true,
        govtFee: true,
        customFields: true,
      },
    }),
    prisma.cashAccount.findMany({
      where: { isActive: true },
      orderBy: { isDefault: "desc" },
      select: { id: true, name: true, currentBalance: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create Service Application
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Intake customer request, capture citizen documents, and settle cash payment into the ledger
          </p>
        </div>
      </div>

      <NewOrderForm
        customers={customers}
        services={services}
        accounts={accounts}
      />
    </div>
  );
}
