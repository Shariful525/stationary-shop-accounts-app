import React from "react";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  Receipt,
  Users,
  ArrowUpRight,
} from "lucide-react";

interface KpiStats {
  cashDrawerBalance?: number;
  totalExpenses: number;
  totalWithdrawals: number;
  todayEarnings: number;
  activeCustomers: number;
  todayExpenses: number;
}

export function KpiCards({ stats }: { stats: KpiStats }) {
  const cards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayEarnings),
      description: "Sales & fees collected today",
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats.totalExpenses),
      description: `Today: ${formatCurrency(stats.todayExpenses)}`,
      icon: Receipt,
      color: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
    },
    {
      title: "Total Withdrawals",
      value: formatCurrency(stats.totalWithdrawals),
      description: "Cash withdrawn from shop",
      icon: ArrowUpRight,
      color: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Active Customers",
      value: stats.activeCustomers.toString(),
      description: "Registered citizen clients",
      icon: Users,
      color: "text-zinc-900 dark:text-zinc-100",
      iconBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="group relative rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-zinc-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-2xl transition duration-200 group-hover:scale-105 ${card.iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                {card.value}
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
