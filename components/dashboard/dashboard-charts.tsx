"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, PieChart as PieIcon, BarChart3, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";

interface DailyTrendData {
  day: string;
  date: string;
  revenue: number;
  expenses: number;
  netProfit: number;
}

interface ExpenseCategoryData {
  name: string;
  value: number;
  color: string;
}

interface ServiceShareData {
  name: string;
  count: number;
  revenue: number;
  color: string;
}

interface DashboardChartsProps {
  dailyTrend: DailyTrendData[];
  expenseCategories: ExpenseCategoryData[];
  serviceShares: ServiceShareData[];
}

const PIE_COLORS = [
  "#18181b", // Zinc 900
  "#10b981", // Emerald
  "#f43f5e", // Rose
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
];

export function DashboardCharts({
  dailyTrend,
  expenseCategories,
  serviceShares,
}: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [pieMode, setPieMode] = useState<"expenses" | "services">("expenses");
  const [chartView, setChartView] = useState<"bar" | "area">("area");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 h-80 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
        </div>
        <div className="lg:col-span-4 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 h-80 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
        </div>
      </div>
    );
  }

  const total7DayRevenue = dailyTrend.reduce((sum, d) => sum + d.revenue, 0);
  const total7DayExpenses = dailyTrend.reduce((sum, d) => sum + d.expenses, 0);

  const activePieData =
    pieMode === "expenses"
      ? expenseCategories.map((c, i) => ({
          name: c.name,
          value: c.value,
          color: PIE_COLORS[i % PIE_COLORS.length],
        }))
      : serviceShares.map((s, i) => ({
          name: s.name,
          value: s.revenue,
          count: s.count,
          color: PIE_COLORS[i % PIE_COLORS.length],
        }));

  const pieTotal = activePieData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltips
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const rev = payload.find((p: any) => p.dataKey === "revenue")?.value || 0;
      const exp = payload.find((p: any) => p.dataKey === "expenses")?.value || 0;
      const net = rev - exp;
      return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 text-xs space-y-2 min-w-[180px]">
          <div className="font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
            {label} ({payload[0]?.payload?.date})
          </div>
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span>Inflow (Revenue):</span>
            <span className="font-bold font-mono">৳{rev.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span>Outflow (Expenses):</span>
            <span className="font-bold font-mono">৳{exp.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100 dark:border-zinc-800 font-bold text-zinc-900 dark:text-zinc-100">
            <span>Net Balance:</span>
            <span className={net >= 0 ? "text-emerald-600 font-mono" : "text-rose-600 font-mono"}>
              ৳{net.toLocaleString()}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = pieTotal > 0 ? ((data.value / pieTotal) * 100).toFixed(1) : "0";
      return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 text-xs space-y-1.5 min-w-[150px]">
          <div className="font-bold text-zinc-900 dark:text-zinc-100">{data.name}</div>
          <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
            <span>Amount:</span>
            <span className="font-bold font-mono">৳{data.value.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Share:</span>
            <span className="font-bold">{percent}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Cash Flow & Revenue Trend Graph (Col-8) */}
      <div className="lg:col-span-8 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Financial Performance & Cash Flow
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                7-day comparison of cash receipts, service revenue, and shop expenses
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 text-[11px] font-semibold border border-zinc-200/60 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setChartView("area")}
                  className={`px-3 py-1 rounded-lg transition ${
                    chartView === "area"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  Area Curve
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("bar")}
                  className={`px-3 py-1 rounded-lg transition ${
                    chartView === "bar"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  Bar Chart
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                <ArrowUpRight className="h-3 w-3" />
                <span>7-Day Inflows</span>
              </div>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(total7DayRevenue)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">
                <ArrowDownRight className="h-3 w-3" />
                <span>7-Day Outflows</span>
              </div>
              <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(total7DayExpenses)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50/80 border border-zinc-200/80 dark:bg-zinc-900/40 dark:border-zinc-800 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-700 dark:text-zinc-300">
                <Layers className="h-3 w-3" />
                <span>Net Margin</span>
              </div>
              <span className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono">
                {formatCurrency(total7DayRevenue - total7DayExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* The Graph Canvas */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "area" ? (
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#a1a1aa" opacity={0.2} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={{ stroke: "#e4e4e7", opacity: 0.5 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `৳${val}`}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (Inflow)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses (Outflow)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#a1a1aa" opacity={0.2} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={{ stroke: "#e4e4e7", opacity: 0.5 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `৳${val}`}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                />
                <Bar dataKey="revenue" name="Inflow (৳)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Outflow (৳)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Categorical Distribution Pie Chart (Col-4) */}
      <div className="lg:col-span-4 rounded-2xl sm:rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                <PieIcon className="h-4 w-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Distribution
              </h3>
            </div>

            {/* Toggle Pie Mode */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 text-[10px] font-semibold border border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setPieMode("expenses")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  pieMode === "expenses"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                Expenses
              </button>
              <button
                type="button"
                onClick={() => setPieMode("services")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  pieMode === "services"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                Services
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            {pieMode === "expenses"
              ? "Shop operating cost breakdown by category"
              : "Citizen service volume & revenue share"}
          </p>
        </div>

        {/* Pie Canvas */}
        <div className="h-52 w-full my-2 relative flex items-center justify-center">
          {activePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={activePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {activePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-xs text-zinc-400 py-10">
              No distribution data available yet
            </div>
          )}

          {/* Center text in donut hole */}
          {activePieData.length > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total</span>
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono">
                {formatCurrency(pieTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Legend List */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-150 dark:border-zinc-800 max-h-36 overflow-y-auto pr-1">
          {activePieData.slice(0, 5).map((item, idx) => {
            const percent = pieTotal > 0 ? ((item.value / pieTotal) * 100).toFixed(0) : "0";
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    ৳{item.value.toLocaleString()}
                  </span>
                  <span className="text-zinc-400 text-[10px] w-7 text-right">{percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
