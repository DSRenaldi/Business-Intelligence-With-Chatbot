import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const currency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const compactCurrency = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 1,
  notation: "compact",
  style: "currency",
});

function formatCurrency(value, compact = false) {
  const numeric = Number(value || 0);
  return compact ? compactCurrency.format(numeric) : currency.format(numeric);
}

function formatMonth(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getQuarterlyRevenue(data) {
  const quarters = new Map();

  data.forEach((item) => {
    const date = new Date(item.month);
    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const key = `${year}-Q${quarter}`;
    const current = quarters.get(key) || {
      month: key,
      monthLabel: `Q${quarter} ${year}`,
      revenue: 0,
    };

    current.revenue += Number(item.revenue || 0);
    quarters.set(key, current);
  });

  return Array.from(quarters.values());
}

function getYearlyRevenue(data) {
  const years = new Map();

  data.forEach((item) => {
    const date = new Date(item.month);
    if (Number.isNaN(date.getTime())) return;

    const year = date.getFullYear();
    const current = years.get(year) || {
      month: String(year),
      monthLabel: String(year),
      revenue: 0,
    };

    current.revenue += Number(item.revenue || 0);
    years.set(year, current);
  });

  return Array.from(years.values());
}

function normalizeRevenue(data) {
  return data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
    revenue: Number(item.revenue || 0),
  }));
}

function RevenueTrendChart({
  revenueData,
  allRevenueData,
  className = "",
  height = 280,
}) {
  const [view, setView] = useState("monthly");
  const normalizedRevenue = normalizeRevenue(revenueData);
  const normalizedAllRevenue = normalizeRevenue(allRevenueData);
  const quarterlyRevenue = getQuarterlyRevenue(normalizedRevenue);
  const yearlyRevenue = getYearlyRevenue(normalizedAllRevenue);
  const chartData =
    view === "yearly"
      ? yearlyRevenue
      : view === "quarterly"
        ? quarterlyRevenue
        : normalizedRevenue;
  const isDenseChart =
    (view === "monthly" && chartData.length > 18) ||
    (view === "quarterly" && chartData.length > 10);
  const xAxisInterval = isDenseChart
    ? Math.max(Math.ceil(chartData.length / 10) - 1, 0)
    : 0;

  return (
    <div className={`rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Revenue Trend
        </h3>
        <div className="flex gap-2">
          {["monthly", "quarterly", "yearly"].map((option) => (
            <button
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize ${
                view === option
                  ? "bg-[#3525cd] text-white"
                  : "bg-[#dce9ff] text-[#464555]"
              }`}
              key={option}
              onClick={() => setView(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 28, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#3525cd" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#3525cd" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              axisLine={false}
              dataKey="monthLabel"
              interval={xAxisInterval}
              minTickGap={isDenseChart ? 18 : 0}
              padding={{ left: 28, right: 28 }}
              tick={{ fill: "#464555", fontSize: 11, fontWeight: 600 }}
              tickLine={false}
            />
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Area
              activeDot={{ fill: "#3525cd", r: 5, stroke: "#ffffff", strokeWidth: 2 }}
              dataKey="revenue"
              dot={{ fill: "#3525cd", r: 4, stroke: "#ffffff", strokeWidth: 2 }}
              fill="url(#revenueGradient)"
              label={
                isDenseChart
                  ? false
                  : {
                      fill: "#464555",
                      fontSize: 10,
                      fontWeight: 700,
                      formatter: (value) => formatCurrency(value, true),
                      position: "top",
                    }
              }
              stroke="#3525cd"
              strokeWidth={3}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueTrendChart;
