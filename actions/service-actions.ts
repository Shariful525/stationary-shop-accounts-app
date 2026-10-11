"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Permission } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type ServiceActionResult = {
  success: boolean;
  error?: string;
};

export async function createServiceAction(
  prevState: ServiceActionResult | null,
  formData: FormData
): Promise<ServiceActionResult> {
  try {
    await requirePermission(Permission.SERVICES_CREATE);

    const name = (formData.get("name") as string)?.trim();
    const code = (formData.get("code") as string)?.trim().toUpperCase().replace(/\s+/g, "_");
    const categoryId = (formData.get("categoryId") as string) || null;
    const baseCharge = parseFloat(formData.get("baseCharge") as string);
    const govtFee = parseFloat((formData.get("govtFee") as string) || "0");
    const costPrice = parseFloat((formData.get("costPrice") as string) || "0");
    const description = (formData.get("description") as string)?.trim() || null;
    const customFieldsJson = formData.get("customFieldsJson") as string;

    if (!name || !code || isNaN(baseCharge) || baseCharge < 0) {
      return { success: false, error: "Service name, unique code, and base charge are required." };
    }

    let customFields = [];
    if (customFieldsJson) {
      try {
        customFields = JSON.parse(customFieldsJson);
      } catch {
        return { success: false, error: "Invalid custom field format." };
      }
    }

    // Check unique code
    const existing = await prisma.service.findUnique({
      where: { code },
    });
    if (existing) {
      return { success: false, error: `Service code '${code}' is already in use.` };
    }

    await prisma.service.create({
      data: {
        name,
        code,
        categoryId: categoryId || undefined,
        baseCharge,
        govtFee,
        costPrice,
        description,
        customFields,
        isActive: true,
      },
    });

    revalidatePath("/services");
    revalidatePath("/orders/new");
    return { success: true };
  } catch (error: any) {
    console.error("Create service error:", error);
    return { success: false, error: error.message || "Failed to create service." };
  }
}

export async function updateServiceAction(
  prevState: ServiceActionResult | null,
  formData: FormData
): Promise<ServiceActionResult> {
  try {
    await requirePermission(Permission.SERVICES_EDIT);

    const serviceId = formData.get("serviceId") as string;
    const name = (formData.get("name") as string)?.trim();
    const code = (formData.get("code") as string)?.trim().toUpperCase().replace(/\s+/g, "_");
    const categoryId = (formData.get("categoryId") as string) || null;
    const baseCharge = parseFloat(formData.get("baseCharge") as string);
    const govtFee = parseFloat((formData.get("govtFee") as string) || "0");
    const costPrice = parseFloat((formData.get("costPrice") as string) || "0");
    const description = (formData.get("description") as string)?.trim() || null;
    const customFieldsJson = formData.get("customFieldsJson") as string;

    if (!serviceId || !name || !code || isNaN(baseCharge) || baseCharge < 0) {
      return { success: false, error: "Service ID, name, unique code, and base charge are required." };
    }

    // Check if code is taken by another service
    const existing = await prisma.service.findUnique({
      where: { code },
    });
    if (existing && existing.id !== serviceId) {
      return { success: false, error: `Service code '${code}' is already used by another service.` };
    }

    let customFields = [];
    if (customFieldsJson) {
      try {
        customFields = JSON.parse(customFieldsJson);
      } catch {
        return { success: false, error: "Invalid custom field format." };
      }
    }

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        name,
        code,
        categoryId: categoryId || undefined,
        baseCharge,
        govtFee,
        costPrice,
        description,
        customFields,
      },
    });

    revalidatePath("/services");
    revalidatePath("/orders/new");
    return { success: true };
  } catch (error: any) {
    console.error("Update service error:", error);
    return { success: false, error: error.message || "Failed to update service." };
  }
}

export async function deleteServiceAction(serviceId: string): Promise<ServiceActionResult> {
  try {
    await requirePermission(Permission.SERVICES_DELETE);

    if (!serviceId) {
      return { success: false, error: "Service ID is required." };
    }

    // Check for associated orders
    const ordersCount = await prisma.serviceOrder.count({
      where: { serviceId },
    });

    if (ordersCount > 0) {
      return {
        success: false,
        error: `Cannot delete service because it has ${ordersCount} associated order(s). You can disable it instead.`,
      };
    }

    await prisma.service.delete({
      where: { id: serviceId },
    });

    revalidatePath("/services");
    revalidatePath("/orders/new");
    return { success: true };
  } catch (error: any) {
    console.error("Delete service error:", error);
    return { success: false, error: error.message || "Failed to delete service." };
  }
}

export async function toggleServiceAction(serviceId: string, currentStatus: boolean) {
  try {
    await requirePermission(Permission.SERVICES_EDIT);
    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/services");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
