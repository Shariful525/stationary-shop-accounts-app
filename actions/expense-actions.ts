"use server";

import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Permission, LedgerEntryType, LedgerDirection, LedgerSource, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type ExpenseActionResult = {
  success: boolean;
  error?: string;
};

export async function createExpenseAction(
  prevState: ExpenseActionResult | null,
  formData: FormData
): Promise<ExpenseActionResult> {
  try {
    const user = await requirePermission(Permission.EXPENSES_CREATE);

    const categoryId = formData.get("categoryId") as string;
    const customCategoryName = (formData.get("customCategoryName") as string)?.trim();
    const accountId = formData.get("accountId") as string;
    const title = (formData.get("title") as string)?.trim();
    const amount = parseFloat(formData.get("amount") as string);
    const paymentMethod = (formData.get("paymentMethod") as PaymentMethod) || PaymentMethod.CASH;
    const note = (formData.get("note") as string)?.trim() || null;
    const dateStr = formData.get("date") as string;
    const date = dateStr ? new Date(dateStr) : new Date();

    if ((!categoryId && !customCategoryName) || !accountId || !title || isNaN(amount) || amount <= 0) {
      return { success: false, error: "Category, cash account, title, and valid amount are required." };
    }

    // Execute in MongoDB Atlas replica set transaction
    await prisma.$transaction(async (tx) => {
      // 0. Resolve category (use custom-written category or existing selection)
      let resolvedCategoryId = categoryId;
      if (customCategoryName) {
        let existingCat = await tx.expenseCategory.findFirst({
          where: { name: { equals: customCategoryName, mode: "insensitive" } },
        });

        if (!existingCat) {
          existingCat = await tx.expenseCategory.create({
            data: {
              name: customCategoryName,
              description: `Custom category: ${customCategoryName}`,
            },
          });
        }
        resolvedCategoryId = existingCat.id;
      }

      if (!resolvedCategoryId || resolvedCategoryId === "__NEW__") {
        throw new Error("Please select or write a valid expense category.");
      }

      // 1. Check account balance
      const account = await tx.cashAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error("Payment cash account not found.");
      }

      if (account.currentBalance < amount) {
        throw new Error(`Insufficient funds in ${account.name} (Available: ৳${account.currentBalance}).`);
      }

      const balanceBefore = account.currentBalance;
      const balanceAfter = balanceBefore - amount;

      // 2. Deduct from cash account
      await tx.cashAccount.update({
        where: { id: accountId },
        data: { currentBalance: balanceAfter },
      });

      // 3. Create Expense entry
      const expense = await tx.expense.create({
        data: {
          expenseNumber: `EXP-${Date.now().toString().slice(-6)}`,
          categoryId: resolvedCategoryId,
          accountId,
          title,
          amount,
          date,
          paymentMethod,
          note,
          createdById: user.id,
        },
        include: {
          category: { select: { name: true } },
        },
      });

      // 4. Generate automated Double-Entry Cash Ledger Entry
      await tx.ledgerEntry.create({
        data: {
          entryNumber: `LED-EXP-${Date.now().toString().slice(-6)}`,
          accountId,
          type: LedgerEntryType.EXPENSE,
          direction: LedgerDirection.OUTFLOW,
          amount,
          balanceBefore,
          balanceAfter,
          source: LedgerSource.EXPENSE_PAYMENT,
          referenceId: expense.id,
          referenceType: "Expense",
          expenseId: expense.id,
          note: `Expense: ${title} (${expense.category.name})`,
          performedById: user.id,
        },
      });
    });

    revalidatePath("/expenses");
    revalidatePath("/ledger");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Create expense error:", error);
    return { success: false, error: error.message || "Failed to record expense." };
  }
}

/**
 * Remove expense and reverse funds back into Cash Drawer + log reversal in ledger
 */
export async function deleteExpenseAction(expenseId: string): Promise<ExpenseActionResult> {
  try {
    const user = await requirePermission(Permission.EXPENSES_DELETE);

    if (!expenseId) {
      return { success: false, error: "Expense ID is required." };
    }

    // Execute in MongoDB Atlas replica set transaction
    await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id: expenseId },
        include: {
          category: { select: { name: true } },
        },
      });

      if (!expense) {
        throw new Error("Expense record not found.");
      }

      // Find the account or fallback to active cash drawer
      let targetAccountId = expense.accountId;
      if (!targetAccountId) {
        const defaultDrawer = await tx.cashAccount.findFirst({
          where: { isActive: true },
          orderBy: { isDefault: "desc" },
        });
        targetAccountId = defaultDrawer?.id || null;
      }

      if (!targetAccountId) {
        throw new Error("No active cash drawer found to reverse funds into.");
      }

      const account = await tx.cashAccount.findUnique({
        where: { id: targetAccountId },
      });

      if (!account) {
        throw new Error("Cash drawer register not found.");
      }

      const balanceBefore = account.currentBalance;
      const balanceAfter = balanceBefore + expense.amount; // Reversing funds back into Cash Drawer

      // 1. Credit the cash drawer back
      await tx.cashAccount.update({
        where: { id: targetAccountId },
        data: { currentBalance: balanceAfter },
      });

      // 2. Create Reversal Cash Ledger Entry
      await tx.ledgerEntry.create({
        data: {
          entryNumber: `LED-REV-${Date.now().toString().slice(-6)}`,
          accountId: targetAccountId,
          type: LedgerEntryType.ADJUSTMENT,
          direction: LedgerDirection.INFLOW,
          amount: expense.amount,
          balanceBefore,
          balanceAfter,
          source: LedgerSource.MANUAL_ADJUSTMENT,
          referenceType: "ExpenseReversal",
          note: `Reversal of Expense ${expense.expenseNumber} (${expense.title}): Refunded ৳${expense.amount.toFixed(2)} to Cash Drawer`,
          performedById: user.id,
        },
      });

      // 3. Delete the expense record
      await tx.expense.delete({
        where: { id: expenseId },
      });
    });

    revalidatePath("/expenses");
    revalidatePath("/ledger");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete expense error:", error);
    return { success: false, error: error.message || "Failed to remove expense." };
  }
}
