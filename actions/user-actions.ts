"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAuth, requireSuperAdmin } from "@/lib/auth/rbac";
import { Permission, RoleType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  ALL_PERMISSIONS,
  STAFF_DEFAULT_PERMISSIONS,
  ADMIN_DEFAULT_PERMISSIONS,
} from "@/lib/auth/permissions-meta";

export type UserActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Create a new team operator / member
 */
export async function createUserAction(
  prevState: UserActionResult | null,
  formData: FormData
): Promise<UserActionResult> {
  try {
    const currentUser = await requireAuth();
    // Only Super Admin or Admin with USERS_MANAGE can create users
    if (currentUser.roleType !== RoleType.SUPER_ADMIN && !currentUser.permissions.includes(Permission.USERS_MANAGE)) {
      return { success: false, error: "Unauthorized: You do not have permission to add new team members." };
    }

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const password = formData.get("password") as string;
    const roleType = (formData.get("roleType") as RoleType) || RoleType.STAFF;
    const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;
    const avatarKey = (formData.get("avatarKey") as string)?.trim() || null;

    if (!name || !email || !password || password.length < 6) {
      return { success: false, error: "Name, valid email, and password (min 6 chars) are required." };
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return { success: false, error: "A user with this email address already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Resolve initial permissions: either custom selected or role default
    const submittedPerms = formData.getAll("permissions") as string[];
    let permissions: Permission[] = [];

    if (roleType === RoleType.SUPER_ADMIN) {
      permissions = ALL_PERMISSIONS;
    } else if (submittedPerms.length > 0) {
      const validEnumValues = new Set(Object.values(Permission));
      permissions = submittedPerms.filter((p): p is Permission => validEnumValues.has(p as Permission));
    } else if (roleType === RoleType.ADMIN) {
      permissions = ADMIN_DEFAULT_PERMISSIONS;
    } else {
      permissions = STAFF_DEFAULT_PERMISSIONS;
    }

    // Find system role record if available
    const role = await prisma.role.findFirst({
      where: { code: roleType },
    });

    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        roleType,
        roleId: role?.id || undefined,
        permissions,
        avatarUrl,
        avatarKey,
        isActive: true,
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { success: false, error: error.message || "Failed to create user account." };
  }
}

/**
 * Edit staff member profile, role, status and granular permissions
 * Strictly restricted to Super Admin
 */
export async function updateUserAction(
  prevState: UserActionResult | null,
  formData: FormData
): Promise<UserActionResult> {
  try {
    const currentUser = await requireSuperAdmin();

    const userId = formData.get("userId") as string;
    if (!userId) {
      return { success: false, error: "Missing user identifier." };
    }

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const newPassword = (formData.get("password") as string)?.trim() || "";
    const roleType = (formData.get("roleType") as RoleType) || RoleType.STAFF;
    const isActive = formData.get("isActive") === "true";
    const avatarUrl = formData.has("avatarUrl")
      ? (formData.get("avatarUrl") as string)?.trim() || null
      : undefined;
    const avatarKey = formData.has("avatarKey")
      ? (formData.get("avatarKey") as string)?.trim() || null
      : undefined;

    if (!name || !email) {
      return { success: false, error: "Name and email are required." };
    }

    // Safety checks for self-editing
    if (currentUser.id === userId) {
      if (roleType !== RoleType.SUPER_ADMIN) {
        return { success: false, error: "Security restriction: You cannot remove your own Super Admin role." };
      }
      if (!isActive) {
        return { success: false, error: "Security restriction: You cannot deactivate your own account." };
      }
    }

    // Verify email uniqueness if changed
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing && existing.id !== userId) {
      return { success: false, error: "Another user is already registered with this email address." };
    }

    // Resolve permissions
    let permissions: Permission[] = [];
    if (roleType === RoleType.SUPER_ADMIN) {
      permissions = ALL_PERMISSIONS;
    } else {
      const submittedPerms = formData.getAll("permissions") as string[];
      const validEnumValues = new Set(Object.values(Permission));
      permissions = submittedPerms.filter((p): p is Permission => validEnumValues.has(p as Permission));
    }

    // Build update payload
    const updateData: any = {
      name,
      email,
      phone,
      roleType,
      isActive,
      permissions,
      // If roleType changed or permissions customized, decouple from default role
      roleId: null,
    };

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }
    if (avatarKey !== undefined) {
      updateData.avatarKey = avatarKey;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long." };
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Update user error:", error);
    return { success: false, error: error.message || "Failed to update staff member." };
  }
}

/**
 * Delete a staff member permanently
 * Strictly restricted to Super Admin
 */
export async function deleteUserAction(userId: string): Promise<UserActionResult> {
  try {
    const currentUser = await requireSuperAdmin();

    if (!userId) {
      return { success: false, error: "Target user ID is required." };
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
      return { success: false, error: "Security restriction: You cannot delete your own Super Admin account." };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { success: false, error: "User not found." };
    }

    // Check if target is another Super Admin and there's only 1 left
    if (targetUser.roleType === RoleType.SUPER_ADMIN) {
      const superAdminCount = await prisma.user.count({
        where: { roleType: RoleType.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        return { success: false, error: "Cannot delete the sole remaining Super Admin in the system." };
      }
    }

    // Check for audit trail dependencies (Expenses & Ledger Entries)
    const [expenseCount, ledgerCount] = await Promise.all([
      prisma.expense.count({ where: { createdById: userId } }),
      prisma.ledgerEntry.count({ where: { performedById: userId } }),
    ]);

    if (expenseCount > 0 || ledgerCount > 0) {
      return {
        success: false,
        error: `Cannot permanently delete ${targetUser.name} because they have recorded ${expenseCount} shop expense(s) and ${ledgerCount} ledger audit entry(s). Please deactivate their account instead to revoke all access immediately while preserving financial audit records.`,
      };
    }

    // Dissociate from any served orders
    await prisma.serviceOrder.updateMany({
      where: { servedById: userId },
      data: { servedById: null },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return { success: false, error: error.message || "Failed to delete user account." };
  }
}

/**
 * Toggle user active/deactivated status
 * Strictly restricted to Super Admin
 */
export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  try {
    const currentUser = await requireSuperAdmin();

    if (currentUser.id === userId) {
      return { success: false, error: "You cannot deactivate your own account." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !currentStatus },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
