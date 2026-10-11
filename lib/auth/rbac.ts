import { Permission, RoleType } from "@prisma/client";
import { AuthUser, getCurrentUser } from "./session";
import { redirect } from "next/navigation";

/**
 * Checks whether an AuthUser has a specific permission.
 * Super Admin always has unrestricted access.
 */
export function hasPermission(
  user: AuthUser | null | undefined,
  requiredPermission: Permission
): boolean {
  if (!user || !user.isActive) return false;

  // Super Admin has unrestricted bypass
  if (user.roleType === RoleType.SUPER_ADMIN) {
    return true;
  }

  return user.permissions.includes(requiredPermission);
}

/**
 * Checks whether an AuthUser has ANY of the specified permissions.
 */
export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user || !user.isActive) return false;
  if (user.roleType === RoleType.SUPER_ADMIN) return true;
  return permissions.some((perm) => user.permissions.includes(perm));
}

/**
 * Checks whether an AuthUser has ALL of the specified permissions.
 */
export function hasAllPermissions(
  user: AuthUser | null | undefined,
  permissions: Permission[]
): boolean {
  if (!user || !user.isActive) return false;
  if (user.roleType === RoleType.SUPER_ADMIN) return true;
  return permissions.every((perm) => user.permissions.includes(perm));
}

/**
 * Check if the user is a Super Admin
 */
export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  if (!user || !user.isActive) return false;
  return user.roleType === RoleType.SUPER_ADMIN;
}

/**
 * Enforces authentication in Server Components or Server Actions.
 * Throws or redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Enforces a specific permission in Server Actions or Server Components.
 * Throws an Unauthorized error if user does not possess the permission.
 */
export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasPermission(user, permission)) {
    throw new Error(`Unauthorized: Missing required permission [${permission}]`);
  }
  return user;
}

/**
 * Enforces Super Admin role for sensitive operations (e.g., Manual Cash Adjustments, System Settings).
 */
export async function requireSuperAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (!isSuperAdmin(user)) {
    throw new Error("Unauthorized: Super Admin access required.");
  }
  return user;
}
