import React from "react";
import { Permission, RoleType } from "@prisma/client";
import { AuthUser } from "@/lib/auth/session";

interface PermissionGateProps {
  user: AuthUser | null | undefined;
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Completely hides unauthorized elements from the DOM.
 * Super Admin bypasses all checks.
 */
export function PermissionGate({
  user,
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  if (!user || !user.isActive) {
    return <>{fallback}</>;
  }

  // Super Admin has unrestricted access to all elements
  if (user.roleType === RoleType.SUPER_ADMIN) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission && !user.permissions.includes(permission)) {
    return <>{fallback}</>;
  }

  // Check anyOf
  if (anyOf && anyOf.length > 0 && !anyOf.some((p) => user.permissions.includes(p))) {
    return <>{fallback}</>;
  }

  // Check allOf
  if (allOf && allOf.length > 0 && !allOf.every((p) => user.permissions.includes(p))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface SuperAdminGateProps {
  user: AuthUser | null | undefined;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Gate strictly for Super Admin operations (e.g. manual ledger adjustments, deletes)
 */
export function SuperAdminGate({ user, children, fallback = null }: SuperAdminGateProps) {
  if (!user || !user.isActive || user.roleType !== RoleType.SUPER_ADMIN) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
