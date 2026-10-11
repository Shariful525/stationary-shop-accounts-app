import prisma from "../lib/prisma";

async function resetDatabase() {
  console.log("🧹 Resetting transactional and customer data...");

  // 1. Delete all service orders
  const deletedOrders = await prisma.serviceOrder.deleteMany({});
  console.log(`Deleted ${deletedOrders.count} service orders.`);

  // 2. Delete all customers
  const deletedCustomers = await prisma.customer.deleteMany({});
  console.log(`Deleted ${deletedCustomers.count} customers.`);

  // 3. Delete all expenses
  const deletedExpenses = await prisma.expense.deleteMany({});
  console.log(`Deleted ${deletedExpenses.count} expenses.`);

  // 4. Delete all ledger entries
  const deletedLedger = await prisma.ledgerEntry.deleteMany({});
  console.log(`Deleted ${deletedLedger.count} ledger entries.`);

  // 5. Reset all cash account balances to 0
  const updatedAccounts = await prisma.cashAccount.updateMany({
    data: {
      currentBalance: 0,
    },
  });
  console.log(`Reset ${updatedAccounts.count} cash accounts balance to 0.`);

  console.log("✅ Database reset complete. User accounts and roles remain untouched.");
}

resetDatabase()
  .catch((e) => {
    console.error("❌ Reset error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
