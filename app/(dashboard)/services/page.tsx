import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { CreateServiceModal } from "@/components/services/create-service-modal";
import { ServicesCatalogClient } from "@/components/services/services-catalog-client";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Permission } from "@prisma/client";

export default async function ServicesPage() {
  const user = await requireAuth();

  const [services, categories] = await Promise.all([
    prisma.service.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.serviceCategory.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Services & Catalog Management</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {services.length} Services
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure dynamic citizen application fees, printing tariffs, and custom application fields
          </p>
        </div>

        <PermissionGate user={user} permission={Permission.SERVICES_CREATE}>
          <CreateServiceModal categories={categories} />
        </PermissionGate>
      </div>

      {/* Services Catalog with Search, Filters, and Pagination */}
      <ServicesCatalogClient
        services={services as any}
        categories={categories}
        user={user}
      />
    </div>
  );
}
