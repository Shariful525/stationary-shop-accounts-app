"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { requireAuth } from "@/lib/auth/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AuthActionResult = {
  success: boolean;
  error?: string;
};

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase().trim() },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: "Your account has been deactivated. Please contact the administrator.",
      };
    }

    const isValidPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" };
    }

    // Generate JWT token
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      roleType: user.roleType,
    });

    await setSessionCookie(token);

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Login action error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export type PasswordChangeResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Allows an authenticated admin/user to change their own password
 * requires current password verification
 */
export async function changePasswordAction(
  prevState: PasswordChangeResult | null,
  formData: FormData
): Promise<PasswordChangeResult> {
  try {
    const sessionUser = await requireAuth();
    const currentPassword = (formData.get("currentPassword") as string) || "";
    const newPassword = (formData.get("newPassword") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: "Please enter your current password, new password, and confirmation." };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "New password and confirm password do not match." };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return { success: false, error: "User account not found." };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "The current password you entered is incorrect." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    revalidatePath("/settings");
    return { success: true, message: "Your password has been changed successfully!" };
  } catch (error: any) {
    console.error("Change password action error:", error);
    return { success: false, error: error.message || "Failed to change password." };
  }
}

export type ProfileUpdateResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Update authenticated admin/user profile details (name, phone, avatar)
 */
export async function updateMyProfileAction(
  prevState: ProfileUpdateResult | null,
  formData: FormData
): Promise<ProfileUpdateResult> {
  try {
    const sessionUser = await requireAuth();
    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const avatarUrl = formData.has("avatarUrl")
      ? (formData.get("avatarUrl") as string)?.trim() || null
      : undefined;
    const avatarKey = formData.has("avatarKey")
      ? (formData.get("avatarKey") as string)?.trim() || null
      : undefined;

    if (!name) {
      return { success: false, error: "Your full name is required." };
    }

    const updateData: any = { name, phone };
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (avatarKey !== undefined) updateData.avatarKey = avatarKey;

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, message: "Profile information updated successfully!" };
  } catch (error: any) {
    console.error("Update profile action error:", error);
    return { success: false, error: error.message || "Failed to update profile." };
  }
}
