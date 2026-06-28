import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  Lightbulb,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import DashboardLayout from "../../layouts/DashboardLayout";
import useCountryRevenue from "../../hooks/useCountryRevenue";
import useInsight from "../../hooks/useInsight";
import useKPI from "../../hooks/useKPI";
import useRevenue from "../../hooks/useRevenue";

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

const colors = ["#3525cd", "#4f46e5", "#7c3aed", "#06b6d4", "#10b981"];

function formatCurrency(value, compact = false) {
  const numeric = Number(value || 0);
  return compact ? compactCurrency.format(numeric) : currency.format(numeric);
}

function formatMonth(value, long = false) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value || "");

  return date.toLocaleDateString("en-US", {
    month: long ? "long" : "short",
    year: long ? undefined : "2-digit",
  });
}

function getGrowth(data) {
  if (data.length < 2) return 0;

  const previous = Number(data[data.length - 2]?.revenue || 0);
  const current = Number(data[data.length - 1]?.revenue || 0);

  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function getPeriodLabel(data) {
  if (!data.length) return "No revenue period available";

  const first = data[0];
  const last = data[data.length - 1];

  return `${formatMonth(first.month)} - ${formatMonth(last.month)}`;
}

function MetricCard({ icon: Icon, label, value, detail, tone = "up" }) {
  const TrendIcon = tone === "down" ? ArrowDownRight : ArrowUpRight;
  const trendColor = tone === "down" ? "text-[#ba1a1a]" : "text-emerald-600";

  return (
    <div className="flex min-h-[160px] flex-col justify-between rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#464555]">
          {label}
        </p>
        <Icon className="text-[#3525cd]" size={22} />
      </div>
      <div className="mt-5">
        <h3 className="text-3xl font-bold text-[#0d1c2e] sm:text-4xl">
          {value}
        </h3>
        <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
          <TrendIcon size={15} />
          <span>{detail}</span>
        </div>
      </div>
    </div>
  );
}

function RevenueBars({ data }) {
  const latest = data.slice(-12);
  const best = latest.reduce(
    (winner, item) => (item.revenue > winner.revenue ? item : winner),
    latest[0] || { revenue: 0 }
  );
  const periodLabel = getPeriodLabel(latest);

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm xl:col-span-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-xl font-semibold text-[#0d1c2e]">
            Monthly Revenue Trend
          </h4>
          <p className="text-sm text-[#464555]">
            Gross revenue performance from dataset period: {periodLabel}
          </p>
        </div>
        <div className="flex w-fit items-center gap-1 rounded-lg bg-[#e6eeff] p-1">
          <button className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-[#3525cd] shadow-sm" type="button">
            Monthly
          </button>
          <button className="rounded-md px-3 py-1 text-xs font-semibold text-[#464555]" type="button">
            Quarterly
          </button>
        </div>
      </div>

      <div className="h-[320px]">
        {latest.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={latest} margin={{ top: 24, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#c7c4d8" strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="monthLabel"
                tick={{ fill: "#464555", fontSize: 11, fontWeight: 600 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fill: "#464555", fontSize: 11 }}
                tickFormatter={(value) => formatCurrency(value, true)}
                tickLine={false}
                width={64}
              />
              <Tooltip
                cursor={{ fill: "#e6eeff" }}
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {latest.map((item) => (
                  <Cell
                    fill={item.month === best.month ? "#4f46e5" : "#3525cd"}
                    fillOpacity={item.month === best.month ? 1 : 0.35}
                    key={item.month}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg bg-[#eff4ff] text-sm font-medium text-[#464555]">
            Revenue data is not available.
          </div>
        )}
      </div>
    </div>
  );
}

function Distribution({ countryData }) {
  const top = countryData.slice(0, 4);
  const total = top.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const sourceData = top.map((item, index) => ({
    name: item.Country,
    revenue: Number(item.revenue || 0),
    share: total ? Math.round((Number(item.revenue || 0) / total) * 100) : 0,
    color: colors[index],
  }));

  return (
    <div className="flex flex-col rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm xl:col-span-4">
      <h4 className="text-xl font-semibold text-[#0d1c2e]">
        Revenue Distribution
      </h4>
      <p className="mb-6 text-sm text-[#464555]">
        Allocation by top regional markets
      </p>
      <div className="relative mx-auto h-52 w-full max-w-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sourceData}
              dataKey="revenue"
              innerRadius={70}
              nameKey="name"
              outerRadius={96}
              paddingAngle={2}
            >
              {sourceData.map((item) => (
                <Cell fill={item.color} key={item.name} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#464555]">
            Top Market
          </span>
          <span className="max-w-32 text-center text-base font-bold leading-tight text-[#0d1c2e]">
            {sourceData[0]?.name || "N/A"}
          </span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sourceData.map((item) => (
          <div className="flex min-w-0 items-center gap-2" key={item.name}>
            <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: item.color }} />
            <span className="truncate text-sm text-[#464555]">
              {item.name} ({item.share}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrowthChart({ data }) {
  const growthData = data.slice(1).map((item, index) => {
    const previous = data[index]?.revenue || 0;
    const growth = previous ? ((item.revenue - previous) / previous) * 100 : 0;

    return {
      month: formatMonth(item.month),
      growth: Number(growth.toFixed(2)),
    };
  });

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm xl:col-span-6">
      <h4 className="text-xl font-semibold text-[#0d1c2e]">
        Revenue Growth Rate
      </h4>
      <p className="mb-6 text-sm text-[#464555]">
        Month-over-month percentage change
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={growthData}>
            <defs>
              <linearGradient id="growthGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#3525cd" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3525cd" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              axisLine={false}
              dataKey="month"
              tick={{ fill: "#464555", fontSize: 10, fontWeight: 600 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#464555", fontSize: 10 }}
              tickLine={false}
              width={36}
            />
            <Tooltip formatter={(value) => `${value}%`} />
            <Area
              dataKey="growth"
              fill="url(#growthGradient)"
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

function CountryBars({ data }) {
  const topCountries = data.slice(0, 5);
  const maxRevenue = Math.max(...topCountries.map((item) => Number(item.revenue || 0)), 1);

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm xl:col-span-6">
      <h4 className="text-xl font-semibold text-[#0d1c2e]">
        Revenue by Country
      </h4>
      <p className="mb-6 text-sm text-[#464555]">
        Top performing regional markets
      </p>
      <div className="space-y-4">
        {topCountries.map((item, index) => {
          const revenue = Number(item.revenue || 0);

          return (
            <div className="space-y-2" key={item.Country || index}>
              <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[#0d1c2e]">
                <span className="truncate">{item.Country}</span>
                <span className="flex-none">{formatCurrency(revenue, true)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e6eeff]">
                <div
                  className="h-full rounded-full bg-[#3525cd]"
                  style={{
                    opacity: 1 - index * 0.12,
                    width: `${Math.max((revenue / maxRevenue) * 100, 6)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, detail, tone = "primary" }) {
  const toneClass = tone === "danger" ? "text-[#ba1a1a]" : "text-[#3525cd]";

  return (
    <div className="flex gap-4 rounded-lg border border-[#3525cd]/10 bg-white/70 p-4 transition hover:bg-white">
      <Icon className={`mt-1 flex-none ${toneClass}`} size={20} />
      <div>
        <p className="text-sm font-semibold leading-6 text-[#0d1c2e]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#464555]">{detail}</p>
      </div>
    </div>
  );
}

function RevenueAnalytics() {
  const { kpi, loading: kpiLoading } = useKPI();
  const { revenueData, loading: revenueLoading } = useRevenue();
  const { data: countryRevenue, loading: countryLoading } = useCountryRevenue();
  const { insight } = useInsight();

  const normalizedRevenue = revenueData
    .map((item) => ({
      month: item.month,
      monthLabel: formatMonth(item.month),
      revenue: Number(item.revenue || 0),
      timestamp: new Date(item.month).getTime(),
    }))
    .filter((item) => Number.isFinite(item.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const latest = normalizedRevenue.slice(-12);
  const bestMonth = latest.reduce(
    (winner, item) => (item.revenue > winner.revenue ? item : winner),
    latest[0] || { month: "", revenue: 0 }
  );
  const lowestMonth = latest.reduce(
    (winner, item) => (item.revenue < winner.revenue ? item : winner),
    latest[0] || { month: "", revenue: 0 }
  );
  const growth = getGrowth(normalizedRevenue);
  const averageOrderValue = kpi?.total_orders
    ? Number(kpi.total_revenue || 0) / Number(kpi.total_orders)
    : 0;
  const isLoading = kpiLoading || revenueLoading || countryLoading;

  return (
    <DashboardLayout>
      {isLoading && (
        <div className="mb-4 rounded-xl border border-[#c7c4d8] bg-white px-4 py-3 text-sm font-medium text-[#464555]">
          Loading revenue analytics from backend...
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% vs previous month`}
          icon={CircleDollarSign}
          label="Total Revenue"
          value={formatCurrency(kpi?.total_revenue, true)}
        />
        <MetricCard
          detail="Derived from total orders"
          icon={ShoppingCart}
          label="Average Order Value"
          tone={growth < 0 ? "down" : "up"}
          value={formatCurrency(averageOrderValue)}
        />
        <MetricCard
          detail={`${formatCurrency(bestMonth.revenue)} total`}
          icon={CalendarCheck}
          label="Best Revenue Month"
          value={formatMonth(bestMonth.month, true) || "N/A"}
        />
        <MetricCard
          detail={`${formatCurrency(lowestMonth.revenue)} total`}
          icon={CalendarX}
          label="Lowest Revenue Month"
          tone="down"
          value={formatMonth(lowestMonth.month, true) || "N/A"}
        />
      </section>

      <section className="mt-6 grid grid-cols-12 gap-5">
        <RevenueBars data={latest} />
        <Distribution countryData={countryRevenue} />
        <GrowthChart data={normalizedRevenue} />
        <CountryBars data={countryRevenue} />
      </section>

      <section className="mt-6 rounded-xl border border-[#3525cd]/20 bg-[#3525cd]/5 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4f46e5] text-white">
            <Zap size={20} />
          </div>
          <h4 className="text-xl font-semibold text-[#3525cd]">
            Revenue Performance Insights
          </h4>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InsightCard
            detail={`Latest month revenue movement is ${growth.toFixed(1)}% compared with the previous month.`}
            icon={growth < 0 ? TrendingDown : TrendingUp}
            title={growth < 0 ? "Revenue growth slowed in the last month." : "Revenue growth improved in the last month."}
            tone={growth < 0 ? "danger" : "primary"}
          />
          <InsightCard
            detail={`${countryRevenue[0]?.Country || "Top market"} contributes the largest revenue share in the current dataset.`}
            icon={TriangleAlert}
            title={`${countryRevenue[0]?.Country || "Top market"} dominates revenue contribution.`}
            tone="danger"
          />
          <InsightCard
            detail={insight?.recommendation || "Prioritize high performing regions and improve retention around lower revenue months."}
            icon={Lightbulb}
            title="Optimization Opportunity"
          />
          <InsightCard
            detail="Use the growth-rate chart to identify seasonal revenue changes before planning forecast targets."
            icon={Bot}
            title="Forecast Signal"
          />
        </div>
      </section>

      <div className="fixed bottom-6 right-6 z-50">
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3525cd] text-white shadow-2xl transition hover:scale-105 active:scale-95" type="button" aria-label="Open assistant">
          <ArrowRight size={22} />
        </button>
      </div>
    </DashboardLayout>
  );
}

export default RevenueAnalytics;
