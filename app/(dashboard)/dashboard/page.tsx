import React from "react";
import { requireAuth } from "@/lib/auth/rbac";
import prisma from "@/lib/prisma";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { OrderStatus, LedgerEntryType } from "@prisma/client";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Start of today for daily metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 7 days ago timestamp for graphs
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Parallel data fetching for maximum performance
  const [
    cashDrawer,
    customersCount,
    pendingOrdersCount,
    completedOrdersCount,
    todayOrders,
    todayExpenses,
    totalExpensesAggregate,
    totalWithdrawalsAggregate,
    totalDepositsAggregate,
    recentOrders,
    recentLedger,
    last7DaysOrders,
    last7DaysExpenses,
    categoryExpenses,
    serviceOrdersShare,
  ] = await Promise.all([
    // 1. Single Shop Cash Drawer
    prisma.cashAccount.findFirst({
      where: { isActive: true },
      orderBy: { isDefault: "desc" },
    }),

    // 2. Customers count
    prisma.customer.count(),

    // 3. Pending/In Progress orders count
    prisma.serviceOrder.count({
      where: {
        status: {
          in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.AWAITING_GOVT_DOC],
        },
      },
    }),

    // 4. Completed orders count
    prisma.serviceOrder.count({
      where: { status: OrderStatus.COMPLETED },
    }),

    // 5. Today's orders for earnings
    prisma.serviceOrder.findMany({
      where: {
        createdAt: { gte: today },
      },
      select: { paidAmount: true },
    }),

    // 6. Today's expenses
    prisma.expense.findMany({
      where: {
        date: { gte: today },
      },
      select: { amount: true },
    }),

    // 7. Total all-time expenses
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),

    // 8. Total all-time withdrawals
    prisma.ledgerEntry.aggregate({
      where: { type: LedgerEntryType.WITHDRAWAL },
      _sum: { amount: true },
    }),

    // 9. Total all-time deposits
    prisma.ledgerEntry.aggregate({
      where: { type: LedgerEntryType.DEPOSIT },
      _sum: { amount: true },
    }),

    // 10. Recent orders
    prisma.serviceOrder.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
      },
    }),

    // 11. Recent ledger entries
    prisma.ledgerEntry.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        account: { select: { name: true } },
      },
    }),

    // 12. 7-day orders for trend chart
    prisma.serviceOrder.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, paidAmount: true },
    }),

    // 13. 7-day expenses for trend chart
    prisma.expense.findMany({
      where: { date: { gte: sevenDaysAgo } },
      select: { date: true, amount: true },
    }),

    // 14. Expense breakdown by category for pie chart
    prisma.expenseCategory.findMany({
      select: {
        id: true,
        name: true,
        expenses: { select: { amount: true } },
      },
    }),

    // 15. Service breakdown for pie chart
    prisma.service.findMany({
      select: {
        id: true,
        name: true,
        serviceOrders: { select: { paidAmount: true } },
      },
    }),
  ]);

  const drawerBalance = cashDrawer?.currentBalance || 0;
  const todayEarnings = todayOrders.reduce((sum, order) => sum + order.paidAmount, 0);
  const todayExpensesAmount = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalExpenses = totalExpensesAggregate._sum.amount || 0;
  const totalWithdrawals = totalWithdrawalsAggregate._sum.amount || 0;
  const totalDeposits = totalDepositsAggregate._sum.amount || 0;

  const stats = {
    cashDrawerBalance: drawerBalance,
    totalExpenses,
    totalWithdrawals,
    todayEarnings,
    activeCustomers: customersCount,
    todayExpenses: todayExpensesAmount,
  };

  const formattedOrders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customer.name,
    customerPhone: o.customer.phone,
    serviceName: o.service.name,
    totalAmount: o.totalAmount,
    status: o.status,
    paymentStatus: o.paymentStatus,
    createdAt: o.createdAt,
  }));

  const formattedLedger = recentLedger.map((l) => ({
    id: l.id,
    entryNumber: l.entryNumber,
    accountName: l.account.name,
    type: l.type,
    amount: l.amount,
    direction: l.direction,
    note: l.note,
    createdAt: l.createdAt,
  }));

  // Build 7-day daily trend for chart
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayName = daysOfWeek[d.getDay()];
    const dateStr = d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });

    const dayRev = last7DaysOrders
      .filter((o) => o.createdAt >= d && o.createdAt < nextDay)
      .reduce((s, o) => s + o.paidAmount, 0);

    const dayExp = last7DaysExpenses
      .filter((e) => e.date >= d && e.date < nextDay)
      .reduce((s, e) => s + e.amount, 0);

    dailyTrend.push({
      day: dayName,
      date: dateStr,
      revenue: dayRev,
      expenses: dayExp,
      netProfit: dayRev - dayExp,
    });
  }

  // Build categorical expense distribution
  const expenseCategories = categoryExpenses
    .map((c) => ({
      name: c.name,
      value: c.expenses.reduce((s, e) => s + e.amount, 0),
      color: "#f43f5e",
    }))
    .filter((c) => c.value > 0);

  // Fallback sample categories if newly seeded shop
  if (expenseCategories.length === 0) {
    expenseCategories.push(
      { name: "Printing Supplies", value: 450, color: "#3b82f6" },
      { name: "Shop Electricity", value: 650, color: "#f59e0b" },
      { name: "Internet Bill", value: 500, color: "#10b981" }
    );
  }

  // Build service order distribution
  const serviceShares = serviceOrdersShare
    .map((s) => ({
      name: s.name,
      count: s.serviceOrders.length,
      revenue: s.serviceOrders.reduce((sum, o) => sum + o.paidAmount, 0),
      color: "#3b82f6",
    }))
    .filter((s) => s.count > 0 || s.revenue > 0);

  if (serviceShares.length === 0) {
    serviceShares.push(
      { name: "Birth Certificate", count: 8, revenue: 1600, color: "#3b82f6" },
      { name: "NID Application", count: 6, revenue: 1500, color: "#10b981" },
      { name: "Passport Form", count: 4, revenue: 2000, color: "#f59e0b" }
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Shop Accounts & Citizen Services
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-200">{user.name}</span>. Real-time counter cash drawer, total withdrawals, and daily operations.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Top KPI Cards (Cash Drawer, Total Expenses, Total Withdrawals, Today's Revenue, Active Customers) */}
      <KpiCards stats={stats} />

      {/* Graphical Data Visualizations (Trend Graph & Categorical Pie Chart) */}
      <DashboardCharts
        dailyTrend={dailyTrend}
        expenseCategories={expenseCategories}
        serviceShares={serviceShares}
      />

      {/* Recent Orders and Real-time Ledger */}
      <RecentActivity orders={formattedOrders} ledger={formattedLedger} />
    </div>
  );
}
