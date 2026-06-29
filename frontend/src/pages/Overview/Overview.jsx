import {
  ArrowRight,
  Bot,
  X,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";

import useCountryRevenue from "../../hooks/useCountryRevenue";
import useInsight from "../../hooks/useInsight";
import useKPI from "../../hooks/useKPI";
import useRevenue from "../../hooks/useRevenue";
import useTopProducts from "../../hooks/useTopProducts";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const chartColors = ["#3525cd", "#565e74", "#4b4dd8", "#06b6d4", "#10b981"];

function formatCurrency(value, compact = false) {
  const numericValue = Number(value || 0);
  return compact
    ? compactCurrencyFormatter.format(numericValue)
    : currencyFormatter.format(numericValue);
}

function formatMonth(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 7);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function getGrowth(data) {
  if (!data || data.length < 2) return 0;

  const previous = Number(data[data.length - 2]?.revenue || 0);
  const current = Number(data[data.length - 1]?.revenue || 0);

  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function KPITile({ icon: Icon, label, value, accent, trend = "Live" }) {
  return (
    <div className="flex min-h-[168px] flex-col justify-between rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={21} strokeWidth={2.3} />
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-[#3525cd]">
          {trend !== "Stable" && <TrendingUp size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#464555]">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold text-[#0d1c2e] sm:text-4xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function CountryDonut({ data }) {
  const topCountries = data.slice(0, 5);
  const totalRevenue = topCountries.reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0
  );

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-semibold text-[#0d1c2e]">
        Revenue by Country
      </h3>
      <div className="relative mx-auto h-52 w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={topCountries}
              dataKey="revenue"
              nameKey="Country"
              innerRadius={66}
              outerRadius={92}
              paddingAngle={2}
            >
              {topCountries.map((item, index) => (
                <Cell
                  key={item.Country || index}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[#464555]">
            Global
          </span>
          <span className="text-xl font-bold text-[#0d1c2e]">
            {formatCurrency(totalRevenue, true)}
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {topCountries.slice(0, 3).map((item, index) => {
          const percentage = totalRevenue
            ? Math.round((Number(item.revenue || 0) / totalRevenue) * 100)
            : 0;

          return (
            <div
              className="flex items-center justify-between gap-3 text-sm"
              key={item.Country || index}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ backgroundColor: chartColors[index] }}
                />
                <span className="truncate font-medium text-[#0d1c2e]">
                  {item.Country || "Unknown"}
                </span>
              </div>
              <span className="font-bold text-[#0d1c2e]">{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopProducts({ products }) {
  const topProducts = products.slice(0, 5);
  const maxRevenue = Math.max(
    ...topProducts.map((product) => Number(product.revenue || 0)),
    1
  );

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-semibold text-[#0d1c2e]">
        Top Products
      </h3>
      <div className="space-y-4">
        {topProducts.map((product, index) => {
          const revenue = Number(product.revenue || 0);
          const width = Math.max((revenue / maxRevenue) * 100, 8);

          return (
            <div className="space-y-2" key={product.Description || index}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-[#0d1c2e]">
                  {product.Description || "Unknown Product"}
                </span>
                <span className="flex-none text-[#464555]">
                  {formatCurrency(revenue, true)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#d5e3fc]">
                <div
                  className="h-full rounded-full bg-[#3525cd]"
                  style={{ opacity: 1 - index * 0.12, width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrdersTrend({ data }) {
  const latest = data.slice(-12);
  const maxRevenue = Math.max(...latest.map((item) => Number(item.revenue || 0)), 1);

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-2">
      <h3 className="mb-5 text-xl font-semibold text-[#0d1c2e]">
        Revenue Pulse
      </h3>
      <div className="flex h-44 items-end gap-2">
        {latest.map((item, index) => {
          const height = Math.max((Number(item.revenue || 0) / maxRevenue) * 100, 10);
          const isLatest = index === latest.length - 1;

          return (
            <div className="flex h-full flex-1 flex-col justify-end" key={`${item.month}-${index}`}>
              <div
                className={`w-full rounded-t transition ${
                  isLatest ? "bg-[#3525cd]" : "bg-[#3525cd]/20 hover:bg-[#3525cd]/40"
                }`}
                style={{ height: `${height}%` }}
                title={`${formatMonth(item.month)}: ${formatCurrency(item.revenue)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between gap-2">
        {latest.map((item, index) => (
          <span
            className={`w-full truncate text-center text-[10px] font-semibold uppercase ${
              index === latest.length - 1 ? "text-[#3525cd]" : "text-[#464555]"
            }`}
            key={`${item.month}-label-${index}`}
          >
            {formatMonth(item.month).split(" ")[0]}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReportModal({ onClose, report }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
      <div className="max-h-[86vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#c7c4d8] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#0d1c2e]">{report.title}</h2>
            <p className="text-xs font-medium text-[#464555]">{report.period}</p>
          </div>
          <button className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[72vh] space-y-6 overflow-y-auto p-6 text-sm text-[#0d1c2e]">
          <section>
            <h3 className="mb-3 text-lg font-bold text-[#3525cd]">Executive Summary</h3>
            <ul className="space-y-2">
              {report.executive_summary.map((item) => (
                <li className="rounded-lg bg-[#f8f9ff] p-3" key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[#c7c4d8] p-4">
              <h3 className="mb-3 font-bold text-[#3525cd]">KPI Overview</h3>
              <p>Total revenue: {formatCurrency(report.kpi.total_revenue)}</p>
              <p>Total orders: {numberFormatter.format(report.kpi.total_orders)}</p>
              <p>Total customers: {numberFormatter.format(report.kpi.total_customers)}</p>
              <p>Average order value: {formatCurrency(report.kpi.average_order_value)}</p>
            </div>
            <div className="rounded-lg border border-[#c7c4d8] p-4">
              <h3 className="mb-3 font-bold text-[#3525cd]">Revenue Analysis</h3>
              <p>Growth: {report.revenue_analysis.latest_complete_growth}%</p>
              <p>Best month: {report.revenue_analysis.best_month?.month} ({formatCurrency(report.revenue_analysis.best_month?.revenue)})</p>
              <p>Weakest month: {report.revenue_analysis.weakest_month?.month} ({formatCurrency(report.revenue_analysis.weakest_month?.revenue)})</p>
              <p className="mt-2 text-xs text-[#464555]">{report.revenue_analysis.note}</p>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-bold text-[#3525cd]">Recommended Actions</h3>
            <ol className="space-y-2">
              {report.recommendations.map((item, index) => (
                <li className="rounded-lg border border-[#c7c4d8] p-3" key={item}>
                  {index + 1}. {item}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function InsightPanel({ insight, growth, onGenerateReport, reportLoading }) {
  const insights = [
    `Revenue growth is ${growth.toFixed(1)}% compared with the previous month.`,
    insight?.top_country
      ? `${insight.top_country} is currently the strongest revenue market.`
      : "Country performance will appear after the API returns revenue segmentation.",
    insight?.recommendation ||
      "Keep monitoring revenue, customers, and product concentration for operational decisions.",
  ];

  return (
    <section className="relative overflow-hidden rounded-xl bg-[#4f46e5] p-6 text-[#dad7ff] shadow-sm lg:p-8">
      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Bot className="text-[#e2dfff]" size={22} />
            <h3 className="text-xl font-bold text-white">
              AI Business Insights
            </h3>
          </div>
          <ul className="space-y-3">
            {insights.map((item) => (
              <li className="flex items-start gap-3 text-sm leading-6" key={item}>
                <Sparkles className="mt-1 flex-none text-[#e2dfff]" size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="flex flex-none items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#3525cd] transition hover:shadow-xl active:scale-95 disabled:opacity-60"
          disabled={reportLoading}
          onClick={onGenerateReport}
          type="button"
        >
          {reportLoading ? "Generating..." : "Generate Full Report"}
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}

function Overview() {
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const { kpi, loading: kpiLoading } = useKPI();
  const { revenueData, loading: revenueLoading } = useRevenue();
  const { products, loading: productsLoading } = useTopProducts();
  const { data: countryRevenue, loading: countryLoading } = useCountryRevenue();
  const { insight } = useInsight();

  const isLoading =
    kpiLoading || revenueLoading || productsLoading || countryLoading;

  const normalizedRevenue = revenueData.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
    revenue: Number(item.revenue || 0),
  }));

  const latestRevenue = normalizedRevenue.slice(-8);
  const growth = getGrowth(normalizedRevenue);

  async function generateReport() {
    setReportLoading(true);

    try {
      const response = await api.get("/api/reports/executive");
      setReport(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <DashboardLayout>
      {report && <ReportModal onClose={() => setReport(null)} report={report} />}
      {isLoading && (
        <div className="mb-4 rounded-xl border border-[#c7c4d8] bg-white px-4 py-3 text-sm font-medium text-[#464555]">
          Loading dashboard data from backend...
        </div>
      )}

      {!kpi && !isLoading && (
        <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
          Gagal mengambil data KPI dari server. Pastikan FastAPI berjalan di
          port 8000.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KPITile
          accent="bg-[#3525cd]/10 text-[#3525cd]"
          icon={WalletCards}
          label="Total Revenue"
          trend={`${growth.toFixed(1)}%`}
          value={formatCurrency(kpi?.total_revenue, true)}
        />
        <KPITile
          accent="bg-[#565e74]/10 text-[#565e74]"
          icon={ShoppingCart}
          label="Total Orders"
          trend="Live"
          value={numberFormatter.format(kpi?.total_orders || 0)}
        />
        <KPITile
          accent="bg-[#4b4dd8]/10 text-[#4b4dd8]"
          icon={Users}
          label="Total Customers"
          trend="Live"
          value={numberFormatter.format(kpi?.total_customers || 0)}
        />
        <KPITile
          accent="bg-[#464555]/10 text-[#464555]"
          icon={Package}
          label="Total Products"
          trend="Stable"
          value={numberFormatter.format(kpi?.total_products || 0)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-[#0d1c2e]">
              Monthly Revenue Trend
            </h3>
            <div className="flex gap-2">
              <button className="rounded-md bg-[#3525cd] px-3 py-1 text-xs font-semibold text-white" type="button">
                Monthly
              </button>
              <button className="rounded-md bg-[#dce9ff] px-3 py-1 text-xs font-semibold text-[#464555]" type="button">
                Quarterly
              </button>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latestRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#3525cd" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#3525cd" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  axisLine={false}
                  dataKey="monthLabel"
                  tickLine={false}
                  tick={{ fill: "#464555", fontSize: 11, fontWeight: 600 }}
                />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area
                  dataKey="revenue"
                  fill="url(#revenueGradient)"
                  stroke="#3525cd"
                  strokeWidth={3}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CountryDonut data={countryRevenue} />

        <TopProducts products={products} />

        <OrdersTrend data={normalizedRevenue} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm xl:col-span-2">
          <h3 className="mb-5 text-xl font-semibold text-[#0d1c2e]">
            Product Revenue Comparison
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products.slice(0, 6)} layout="vertical">
                <XAxis hide type="number" />
                <YAxis
                  axisLine={false}
                  dataKey="Description"
                  tickLine={false}
                  tick={{ fill: "#464555", fontSize: 11 }}
                  type="category"
                  width={150}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill="#3525cd" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-xl font-semibold text-[#0d1c2e]">
            Executive Summary
          </h3>
          <div className="space-y-4 text-sm text-[#464555]">
            <p>
              Top product:{" "}
              <span className="font-semibold text-[#0d1c2e]">
                {insight?.top_product || products[0]?.Description || "N/A"}
              </span>
            </p>
            <p>
              Top country:{" "}
              <span className="font-semibold text-[#0d1c2e]">
                {insight?.top_country || countryRevenue[0]?.Country || "N/A"}
              </span>
            </p>
            <p>
              Revenue growth:{" "}
              <span className="font-semibold text-[#0d1c2e]">
                {insight?.revenue_growth ?? growth.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <InsightPanel
          growth={growth}
          insight={insight}
          onGenerateReport={generateReport}
          reportLoading={reportLoading}
        />
      </div>

      <footer className="mt-8 border-t border-[#c7c4d8] py-5 text-center text-xs font-medium text-[#464555]/80">
        © 2026 Business AI Analytics Enterprise BI Edition. All systems
        operational.
      </footer>
    </DashboardLayout>
  );
}

export default Overview;
