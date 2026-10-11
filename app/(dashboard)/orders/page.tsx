import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { PermissionGate } from "@/components/auth/permission-gate";
import { OrdersTableClient } from "@/components/orders/orders-table-client";
import { Permission } from "@prisma/client";
import { Plus } from "lucide-react";

export default async function OrdersPage() {
  const user = await requireAuth();

  const orders = await prisma.serviceOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          nidNumber: true,
          birthRegNumber: true,
          currentDue: true,
        },
      },
      service: { select: { id: true, name: true } },
      servedBy: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Service Applications & Orders</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {orders.length} Orders
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track citizen service workflow, NID/Passport processing stages, and invoice settlements
          </p>
        </div>

        <PermissionGate user={user} permission={Permission.ORDERS_CREATE}>
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Service Application</span>
          </Link>
        </PermissionGate>
      </div>

      {/* Orders Client with Search, Filters, and Pagination */}
      <OrdersTableClient orders={orders as any} user={user} />
    </div>
  );
}
