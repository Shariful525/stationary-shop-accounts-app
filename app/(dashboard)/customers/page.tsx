import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { CreateCustomerModal } from "@/components/customers/create-customer-modal";
import { CustomersDirectoryClient } from "@/components/customers/customers-directory-client";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Permission } from "@prisma/client";

export default async function CustomersPage() {
  const user = await requireAuth();

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { serviceOrders: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Customer CRM & Document Vault</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              {customers.length} Profiles
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Citizen profiles, contact directory, identity registrations, and Cloudflare R2 document storage
          </p>
        </div>

        <PermissionGate user={user} permission={Permission.CUSTOMERS_CREATE}>
          <CreateCustomerModal />
        </PermissionGate>
      </div>

      {/* Customer Directory with Real-Time Search, Balance Filter & Pagination */}
      <CustomersDirectoryClient customers={customers as any} user={user} />
    </div>
  );
}
