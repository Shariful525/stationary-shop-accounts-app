"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import {
  Permission,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  LedgerEntryType,
  LedgerDirection,
  LedgerSource,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

export type OrderActionResult = {
  success: boolean;
  error?: string;
  orderId?: string;
};

export async function createOrderAction(
  prevState: OrderActionResult | null,
  formData: FormData
): Promise<OrderActionResult> {
  try {
    const user = await requirePermission(Permission.ORDERS_CREATE);

    const customerId = formData.get("customerId") as string;
    const serviceId = formData.get("serviceId") as string;
    const accountId = formData.get("accountId") as string;
    const extraFee = parseFloat((formData.get("extraFee") as string) || "0");
    const discount = parseFloat((formData.get("discount") as string) || "0");
    const paidAmount = parseFloat((formData.get("paidAmount") as string) || "0");
    const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || PaymentMethod.CASH;
    const customValuesJson = formData.get("customValuesJson") as string;
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!customerId || !serviceId) {
      return { success: false, error: "Please select both a customer and a service." };
    }

    const [customer, service] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!customer || !service) {
      return { success: false, error: "Customer or service not found." };
    }

    const baseCharge = service.baseCharge;
    const govtFee = service.govtFee;
    const totalAmount = Math.max(0, baseCharge + govtFee + extraFee - discount);

    // Check available advance balance in customer profile to deduct automatically
    const availableAdvance = customer.advanceBalance || 0;
    const initialDue = Math.max(0, totalAmount - paidAmount);
    const advanceToDeduct = Math.min(availableAdvance, initialDue);

    const finalPaidAmount = paidAmount + advanceToDeduct;
    const finalDueAmount = Math.max(0, initialDue - advanceToDeduct);

    let paymentStatus: PaymentStatus = PaymentStatus.DUE;
    if (finalPaidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = PaymentStatus.PAID;
    } else if (finalPaidAmount > 0) {
      paymentStatus = PaymentStatus.PARTIAL;
    }

    const orderNotes = [
      notes,
      advanceToDeduct > 0 ? `Advance Credit Applied: ৳${advanceToDeduct.toFixed(2)}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    let customValues = [];
    if (customValuesJson) {
      try {
        customValues = JSON.parse(customValuesJson);
      } catch {
        // ignore format issues
      }
    }

    const orderNumber = `SO-${Date.now().toString().slice(-6)}`;

    let createdOrderId: string | undefined;

    // Run within MongoDB Atlas replica set transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create ServiceOrder
      const createdOrder = await tx.serviceOrder.create({
        data: {
          orderNumber,
          customerId,
          serviceId,
          baseCharge,
          govtFee,
          extraFee,
          discount,
          totalAmount,
          paidAmount: finalPaidAmount,
          dueAmount: finalDueAmount,
          status: OrderStatus.PENDING,
          paymentStatus,
          paymentMethod,
          accountId: accountId || undefined,
          customValues,
          notes: orderNotes || null,
          servedById: user.id,
        },
      });

      createdOrderId = createdOrder.id;

      // 2. Update customer balances: deduct used advance and increment due if unpaid
      const customerUpdateData: any = {};
      if (advanceToDeduct > 0) {
        customerUpdateData.advanceBalance = { decrement: advanceToDeduct };
      }
      if (finalDueAmount > 0) {
        customerUpdateData.currentDue = { increment: finalDueAmount };
      }
      if (Object.keys(customerUpdateData).length > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: customerUpdateData,
        });
      }

      // 3. If paidAmount > 0 and accountId provided, credit cash account and write ledger entry
      if (paidAmount > 0 && accountId) {
        const cashAcc = await tx.cashAccount.findUnique({
          where: { id: accountId },
        });

        if (cashAcc) {
          const balanceBefore = cashAcc.currentBalance;
          const balanceAfter = balanceBefore + paidAmount;

          // Credit cash register
          await tx.cashAccount.update({
            where: { id: accountId },
            data: { currentBalance: balanceAfter },
          });

          // Create Double-Entry Ledger Entry
          await tx.ledgerEntry.create({
            data: {
              entryNumber: `LED-SO-${Date.now().toString().slice(-6)}`,
              accountId,
              type: LedgerEntryType.INCOME,
              direction: LedgerDirection.INFLOW,
              amount: paidAmount,
              balanceBefore,
              balanceAfter,
              source: LedgerSource.SERVICE_SALE,
              referenceId: createdOrder.id,
              referenceType: "ServiceOrder",
              serviceOrderId: createdOrder.id,
              customerId,
              note: `Service Payment: ${service.name} for ${customer.name} (${orderNumber})`,
              performedById: user.id,
            },
          });
        }
      }
    });

    revalidatePath("/orders");
    revalidatePath("/ledger");
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    return { success: true, orderId: createdOrderId };
  } catch (error: any) {
    console.error("Create order error:", error);
    return { success: false, error: error.message || "Failed to create service order." };
  }
}

/**
 * Manage workflow stage of an order (PENDING -> IN_PROGRESS -> AWAITING_GOVT_DOC -> READY_FOR_DELIVERY -> COMPLETED)
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
) {
  try {
    await requirePermission(Permission.ORDERS_UPDATE);

    const dataToUpdate: any = { status: newStatus };
    if (newStatus === OrderStatus.COMPLETED) {
      dataToUpdate.completedAt = new Date();
    }
    if (notes) {
      dataToUpdate.notes = notes;
    }

    await prisma.serviceOrder.update({
      where: { id: orderId },
      data: dataToUpdate,
    });

    revalidatePath("/orders");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Collect Due Payment for a Customer or specific Order
 * - Deducts from customer.currentDue
 * - Updates order.paidAmount and dueAmount
 * - Credits Cash Drawer
 * - Logs double-entry Cash Ledger Entry
 */
export async function collectDuePaymentAction(
  customerId: string,
  amountPaid: number,
  orderId?: string,
  note?: string
): Promise<OrderActionResult> {
  try {
    const user = await requirePermission(Permission.ORDERS_UPDATE);

    if (!customerId || amountPaid <= 0 || isNaN(amountPaid)) {
      return { success: false, error: "Valid customer and positive payment amount are required." };
    }

    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error("Customer not found.");
      }

      // Find primary cash drawer
      const drawer = await tx.cashAccount.findFirst({
        where: { isActive: true },
        orderBy: { isDefault: "desc" },
      });

      if (!drawer) {
        throw new Error("No active Cash Drawer found to receive payment.");
      }

      // 1. Settle against target order if specified, then cascade to customer's recent due orders (LIFO / desc)
      let remainingToDistribute = amountPaid;
      let orderNumberText = "";

      if (orderId) {
        const order = await tx.serviceOrder.findUnique({
          where: { id: orderId },
        });

        if (order && order.dueAmount > 0) {
          orderNumberText = ` for Order ${order.orderNumber}`;
          const deduct = Math.min(order.dueAmount, remainingToDistribute);
          const newPaidAmount = order.paidAmount + deduct;
          const newDueAmount = Math.max(0, order.dueAmount - deduct);
          const newPaymentStatus: PaymentStatus =
            newDueAmount <= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

          await tx.serviceOrder.update({
            where: { id: orderId },
            data: {
              paidAmount: newPaidAmount,
              dueAmount: newDueAmount,
              paymentStatus: newPaymentStatus,
            },
          });

          remainingToDistribute -= deduct;
        }
      }

      // If money remains or paying from customer card, deduct from recent orders with due (most recent first)
      if (remainingToDistribute > 0) {
        const unpaidOrders = await tx.serviceOrder.findMany({
          where: {
            customerId,
            dueAmount: { gt: 0 },
            ...(orderId ? { id: { not: orderId } } : {}),
          },
          orderBy: { createdAt: "desc" }, // MOST RECENT FIRST
        });

        for (const unpOrder of unpaidOrders) {
          if (remainingToDistribute <= 0) break;
          const deduct = Math.min(unpOrder.dueAmount, remainingToDistribute);
          const newPaidAmount = unpOrder.paidAmount + deduct;
          const newDueAmount = Math.max(0, unpOrder.dueAmount - deduct);
          const newPaymentStatus: PaymentStatus =
            newDueAmount <= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

          await tx.serviceOrder.update({
            where: { id: unpOrder.id },
            data: {
              paidAmount: newPaidAmount,
              dueAmount: newDueAmount,
              paymentStatus: newPaymentStatus,
            },
          });

          remainingToDistribute -= deduct;
        }
      }

      // 2. Surplus money after clearing all due orders is stored as Customer Advance Credit
      const advanceStored = remainingToDistribute;
      const totalAppliedToDues = amountPaid - advanceStored;

      const newCustomerDue = Math.max(0, customer.currentDue - totalAppliedToDues);
      const newAdvanceBalance = (customer.advanceBalance || 0) + advanceStored;

      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentDue: newCustomerDue,
          advanceBalance: newAdvanceBalance,
        },
      });

      // 3. Credit Shop Cash Drawer with total cash received
      const balanceBefore = drawer.currentBalance;
      const balanceAfter = balanceBefore + amountPaid;

      await tx.cashAccount.update({
        where: { id: drawer.id },
        data: { currentBalance: balanceAfter },
      });

      // 4. Create Ledger Entry
      const advanceSummary = advanceStored > 0
        ? ` (৳${advanceStored.toFixed(2)} stored as Advance Credit)`
        : "";
      const dueSummary = totalAppliedToDues > 0
        ? `৳${totalAppliedToDues.toFixed(2)} applied to recent orders`
        : "Advance Deposit";

      await tx.ledgerEntry.create({
        data: {
          entryNumber: `LED-DUE-${Date.now().toString().slice(-6)}`,
          accountId: drawer.id,
          type: LedgerEntryType.INCOME,
          direction: LedgerDirection.INFLOW,
          amount: amountPaid,
          balanceBefore,
          balanceAfter,
          source: LedgerSource.CUSTOMER_DUE_PAYMENT,
          referenceId: orderId || customerId,
          referenceType: orderId ? "ServiceOrder" : "Customer",
          serviceOrderId: orderId || undefined,
          customerId,
          note: `Payment from ${customer.name}${orderNumberText}: ৳${amountPaid.toFixed(2)} (${dueSummary}${advanceSummary})${note ? ` [${note}]` : ""}`,
          performedById: user.id,
        },
      });
    });

    revalidatePath("/orders");
    revalidatePath("/customers");
    revalidatePath("/ledger");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Collect due payment error:", error);
    return { success: false, error: error.message || "Failed to collect due payment." };
  }
}

/**
 * Delete Service Order with Customer Refund & Cash Drawer Reversal
 * - If order.paidAmount > 0: refunds money to customer from Cash Drawer & logs OUTFLOW ledger entry
 * - If order.dueAmount > 0: clears outstanding due from customer.currentDue
 * - Deletes the service order record
 */
export async function deleteOrderAndRefundAction(orderId: string): Promise<OrderActionResult> {
  try {
    const user = await requirePermission(Permission.ORDERS_DELETE);

    if (!orderId) {
      return { success: false, error: "Order ID is required." };
    }

    await prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          service: true,
        },
      });

      if (!order) {
        throw new Error("Service order record not found.");
      }

      // 1. If customer paid money, refund it from Cash Drawer
      if (order.paidAmount > 0) {
        const drawer = await tx.cashAccount.findFirst({
          where: { isActive: true },
          orderBy: { isDefault: "desc" },
        });

        if (!drawer) {
          throw new Error("No active Cash Drawer found to issue customer refund.");
        }

        if (drawer.currentBalance < order.paidAmount) {
          throw new Error(
            `Insufficient cash in drawer to refund ৳${order.paidAmount}. Current drawer balance: ৳${drawer.currentBalance}.`
          );
        }

        const balanceBefore = drawer.currentBalance;
        const balanceAfter = balanceBefore - order.paidAmount;

        // Deduct refunded amount from drawer
        await tx.cashAccount.update({
          where: { id: drawer.id },
          data: { currentBalance: balanceAfter },
        });

        // Log refund in ledger
        await tx.ledgerEntry.create({
          data: {
            entryNumber: `LED-REF-${Date.now().toString().slice(-6)}`,
            accountId: drawer.id,
            type: LedgerEntryType.WITHDRAWAL,
            direction: LedgerDirection.OUTFLOW,
            amount: order.paidAmount,
            balanceBefore,
            balanceAfter,
            source: LedgerSource.MANUAL_ADJUSTMENT,
            referenceType: "OrderRefund",
            customerId: order.customerId,
            note: `Refund to ${order.customer.name} for Cancelled Order ${order.orderNumber} (${order.service.name}): ৳${order.paidAmount.toFixed(2)} refunded from Cash Drawer`,
            performedById: user.id,
          },
        });
      }

      // 2. If order had unpaid due, remove it from customer's profile balance
      if (order.dueAmount > 0) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            currentDue: {
              decrement: order.dueAmount,
            },
          },
        });
      }

      // 3. Delete the order
      await tx.serviceOrder.delete({
        where: { id: orderId },
      });
    });

    revalidatePath("/orders");
    revalidatePath("/customers");
    revalidatePath("/ledger");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete & refund order error:", error);
    return { success: false, error: error.message || "Failed to delete order." };
  }
}
