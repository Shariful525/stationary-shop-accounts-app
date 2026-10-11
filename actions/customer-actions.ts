"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Permission } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type CustomerActionResult = {
  success: boolean;
  error?: string;
  customerId?: string;
};

export async function createCustomerAction(
  prevState: CustomerActionResult | null,
  formData: FormData
): Promise<CustomerActionResult> {
  try {
    await requirePermission(Permission.CUSTOMERS_CREATE);

    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const nidNumber = (formData.get("nidNumber") as string)?.trim() || null;
    const birthRegNumber = (formData.get("birthRegNumber") as string)?.trim() || null;
    const street = (formData.get("street") as string)?.trim() || null;
    const upazila = (formData.get("upazila") as string)?.trim() || null;
    const district = (formData.get("district") as string)?.trim() || null;
    const postalCode = (formData.get("postalCode") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const profilePhotoUrl = (formData.get("profilePhotoUrl") as string)?.trim() || null;
    const profilePhotoKey = (formData.get("profilePhotoKey") as string)?.trim() || null;

    if (!name || !phone) {
      return { success: false, error: "Customer name and phone number are required." };
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email,
        nidNumber,
        birthRegNumber,
        profilePhotoUrl,
        profilePhotoKey,
        address: {
          street,
          upazila,
          district,
          postalCode,
        },
        notes,
        currentDue: 0,
      },
    });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    revalidatePath("/orders/new");
    return { success: true, customerId: customer.id };
  } catch (error: any) {
    console.error("Create customer error:", error);
    return { success: false, error: error.message || "Failed to create customer." };
  }
}

export async function updateCustomerAction(
  prevState: CustomerActionResult | null,
  formData: FormData
): Promise<CustomerActionResult> {
  try {
    await requirePermission(Permission.CUSTOMERS_EDIT);

    const customerId = formData.get("customerId") as string;
    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const nidNumber = (formData.get("nidNumber") as string)?.trim() || null;
    const birthRegNumber = (formData.get("birthRegNumber") as string)?.trim() || null;
    const street = (formData.get("street") as string)?.trim() || null;
    const upazila = (formData.get("upazila") as string)?.trim() || null;
    const district = (formData.get("district") as string)?.trim() || null;
    const postalCode = (formData.get("postalCode") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const profilePhotoUrl = formData.has("profilePhotoUrl")
      ? (formData.get("profilePhotoUrl") as string)?.trim() || null
      : undefined;
    const profilePhotoKey = formData.has("profilePhotoKey")
      ? (formData.get("profilePhotoKey") as string)?.trim() || null
      : undefined;

    if (!customerId || !name || !phone) {
      return { success: false, error: "Customer ID, name, and phone number are required." };
    }

    const updateData: any = {
      name,
      phone,
      email,
      nidNumber,
      birthRegNumber,
      address: {
        street,
        upazila,
        district,
        postalCode,
      },
      notes,
    };

    if (profilePhotoUrl !== undefined) {
      updateData.profilePhotoUrl = profilePhotoUrl;
    }
    if (profilePhotoKey !== undefined) {
      updateData.profilePhotoKey = profilePhotoKey;
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    revalidatePath("/orders/new");
    return { success: true, customerId };
  } catch (error: any) {
    console.error("Update customer error:", error);
    return { success: false, error: error.message || "Failed to update customer." };
  }
}

export async function deleteCustomerAction(customerId: string): Promise<CustomerActionResult> {
  try {
    await requirePermission(Permission.CUSTOMERS_DELETE);

    if (!customerId) {
      return { success: false, error: "Customer ID is required." };
    }

    const ordersCount = await prisma.serviceOrder.count({
      where: { customerId },
    });

    if (ordersCount > 0) {
      return {
        success: false,
        error: `Cannot delete customer because they have ${ordersCount} associated order(s).`,
      };
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete customer error:", error);
    return { success: false, error: error.message || "Failed to delete customer." };
  }
}
