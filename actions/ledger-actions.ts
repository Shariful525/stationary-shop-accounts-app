"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin, requireAuth, hasPermission } from "@/lib/auth/rbac";
import { LedgerEntryType, LedgerDirection, LedgerSource, Permission } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type LedgerActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Super Admin Manual Deposit (Capital / Cash In)
 */
export async function manualDepositAction(
  prevState: LedgerActionResult | null,
  formData: FormData
): Promise<LedgerActionResult> {
  try {
    const user = await requireSuperAdmin();

    const accountId = formData.get("accountId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const note = (formData.get("note") as string)?.trim();

    if (!accountId || isNaN(amount) || amount <= 0) {
      return { success: false, error: "Please provide a valid cash account and positive amount." };
    }

    if (!note) {
      return { success: false, error: "A note or reason is required for manual deposits." };
    }

    await prisma.$transaction(async (tx) => {
      const account = await tx.cashAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error("Cash account not found");
      }

      const balanceBefore = account.currentBalance;
      const balanceAfter = balanceBefore + amount;

      // 1. Update account balance
      await tx.cashAccount.update({
        where: { id: accountId },
        data: { currentBalance: balanceAfter },
      });

      // 2. Create Ledger entry
      await tx.ledgerEntry.create({
        data: {
          entryNumber: `LED-DEP-${Date.now().toString().slice(-6)}`,
          accountId,
          type: LedgerEntryType.DEPOSIT,
          direction: LedgerDirection.INFLOW,
          amount,
          balanceBefore,
          balanceAfter,
          source: LedgerSource.MANUAL_DEPOSIT,
          referenceType: "Manual",
          note: `Manual Cash In: ${note}`,
          performedById: user.id,
        },
      });
    });

    revalidatePath("/ledger");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Manual deposit error:", error);
    return { success: false, error: error.message || "Failed to process deposit." };
  }
}

/**
 * Super Admin Manual Withdraw (Cash Out / Owner Drawing)
 */
export async function manualWithdrawAction(
  prevState: LedgerActionResult | null,
  formData: FormData
): Promise<LedgerActionResult> {
  try {
    const user = await requireSuperAdmin();

    const accountId = formData.get("accountId") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const note = (formData.get("note") as string)?.trim();

    if (!accountId || isNaN(amount) || amount <= 0) {
      return { success: false, error: "Please provide a valid cash account and positive amount." };
    }

    if (!note) {
      return { success: false, error: "A note or reason is required for manual withdrawals." };
    }

    await prisma.$transaction(async (tx) => {
      const account = await tx.cashAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error("Cash account not found");
      }

      if (account.currentBalance < amount) {
        throw new Error(`Insufficient funds in ${account.name}. Available: ৳${account.currentBalance}`);
      }

      const balanceBefore = account.currentBalance;
      const balanceAfter = balanceBefore - amount;

      await tx.cashAccount.update({
        where: { id: accountId },
        data: { currentBalance: balanceAfter },
      });

      await tx.ledgerEntry.create({
        data: {
          entryNumber: `LED-WTH-${Date.now().toString().slice(-6)}`,
          accountId,
          type: LedgerEntryType.WITHDRAWAL,
          direction: LedgerDirection.OUTFLOW,
          amount,
          balanceBefore,
          balanceAfter,
          source: LedgerSource.MANUAL_WITHDRAWAL,
          referenceType: "Manual",
          note: `Manual Cash Out: ${note}`,
          performedById: user.id,
        },
      });
    });

    revalidatePath("/ledger");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Manual withdrawal error:", error);
    return { success: false, error: error.message || "Failed to process withdrawal." };
  }
}

/**
 * Super Admin Cash Adjustment (Audit discrepancy correction with mandatory reason)
 */
export async function manualAdjustmentAction(
  prevState: LedgerActionResult | null,
  formData: FormData
): Promise<LedgerActionResult> {
  try {
    const user = await requireSuperAdmin();

    const accountId = formData.get("accountId") as string;
    const actualPhysicalBalance = parseFloat(formData.get("actualBalance") as string);
    const reason = (formData.get("reason") as string)?.trim();

    if (!accountId || isNaN(actualPhysicalBalance) || actualPhysicalBalance < 0) {
      return { success: false, error: "Please specify a valid physical cash tally amount." };
    }

    if (!reason || reason.length < 5) {
      return {
        success: false,
        error: "A detailed explanation/reason (min 5 characters) is mandatory for audit adjustments.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const account = await tx.cashAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error("Cash account not found");
      }

      const balanceBefore = account.currentBalance;
      const discrepancy = actualPhysicalBalance - balanceBefore;

      if (discrepancy === 0) {
        throw new Error("Physical balance matches the ledger exactly. No adjustment needed.");
      }

      const direction = discrepancy > 0 ? LedgerDirection.INFLOW : LedgerDirection.OUTFLOW;
      const adjustmentAmount = Math.abs(discrepancy);

      await tx.cashAccount.update({
        where: { id: accountId },
        data: { currentBalance: actualPhysicalBalance },
      });

      await tx.ledgerEntry.create({
        data: {
          entryNumber: `LED-ADJ-${Date.now().toString().slice(-6)}`,
          accountId,
          type: LedgerEntryType.ADJUSTMENT,
          direction,
          amount: adjustmentAmount,
          balanceBefore,
          balanceAfter: actualPhysicalBalance,
          source: LedgerSource.MANUAL_ADJUSTMENT,
          referenceType: "Manual",
          note: `Audit Tally Adjustment: ${reason} (Shift: ${discrepancy > 0 ? "+" : ""}${discrepancy.toFixed(2)})`,
          performedById: user.id,
        },
      });
    });

    revalidatePath("/ledger");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Manual adjustment error:", error);
    return { success: false, error: error.message || "Failed to process adjustment." };
  }
}
