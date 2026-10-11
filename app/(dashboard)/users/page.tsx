import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { CreateUserModal } from "@/components/users/create-user-modal";
import { UsersTableClient } from "@/components/users/users-table-client";
import { PermissionGate } from "@/components/auth/permission-gate";
import { Permission, RoleType } from "@prisma/client";
import { Lock, Crown } from "lucide-react";

export default async function UsersPage() {
  const currentUser = await requireAuth();
  const isSuperAdmin = currentUser.roleType === RoleType.SUPER_ADMIN;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      role: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Team & Access Control (RBAC)</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {users.length} Users
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Granular permissions enforcement: Super Admin, Admins, and Counter Staff Operators
          </p>
        </div>

        <PermissionGate user={currentUser} permission={Permission.USERS_MANAGE}>
          <CreateUserModal />
        </PermissionGate>
      </div>

      {/* Role Notice Banner */}
      {isSuperAdmin ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                Super Administrator Access Active
              </h2>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                You have exclusive authority to edit staff accounts, customize granular permissions (what each member can access and do), toggle account activation, and safely remove members.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                Staff Directory (View Mode)
              </h2>
              <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                Staff profile editing, permission management, and deletions are strictly restricted to the Super Administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table with Live Search, Role Filters, and Pagination */}
      <UsersTableClient
        users={users as any}
        currentUser={currentUser}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
