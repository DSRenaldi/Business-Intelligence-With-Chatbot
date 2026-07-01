import {
  Filter,
  Info,
  MoreVertical,
  Repeat,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";
import YearFilter from "../../components/filters/YearFilter";
import api from "../../services/api";
import useCountryRevenue from "../../hooks/useCountryRevenue";
import useDashboardYear from "../../hooks/useDashboardYear";
import useDashboardYears from "../../hooks/useDashboardYears";
import useKPI from "../../hooks/useKPI";

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

const number = new Intl.NumberFormat("en-US");
const colors = ["#3525cd", "#565e74", "#bec6e0"];

function formatCurrency(value, compact = false) {
  const numeric = Number(value || 0);
  return compact ? compactCurrency.format(numeric) : currency.format(numeric);
}

function useTopCustomers(limit = 5000, year = "all") {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/customers/top", {
        params: year === "all" ? { limit } : { limit, year },
      })
      .then((res) => setCustomers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit, year]);

  return { customers, loading };
}

function useCustomerActivity({ country, minOrders, page, pageSize, query, year }) {
  const [data, setData] = useState({
    items: [],
    page: 1,
    page_size: pageSize,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/customers/activity", {
        params: {
          ...(year === "all" ? {} : { year }),
          ...(query ? { search: query } : {}),
          ...(country === "all" ? {} : { country }),
          ...(minOrders ? { min_orders: minOrders } : {}),
          page,
          page_size: pageSize,
        },
      })
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [country, minOrders, page, pageSize, query, year]);

  return { data, loading };
}

function MetricCard({ icon: Icon, label, value, detail, tone = "up" }) {
  const trendClass = tone === "down" ? "text-[#ba1a1a]" : "text-[#3525cd]";
  const TrendIcon = tone === "down" ? TrendingDown : TrendingUp;

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#464555]">
          {label}
        </div>
        <Icon className="text-[#3525cd]" size={22} />
      </div>
      <div className="text-3xl font-bold text-[#0d1c2e] sm:text-4xl">
        {value}
      </div>
      <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${trendClass}`}>
        <TrendIcon size={15} />
        <span>{detail}</span>
      </div>
    </div>
  );
}

function TopCustomersBars({ customers, totalRevenue }) {
  const [reportOpen, setReportOpen] = useState(false);
  const top = customers.slice(0, 5);
  const maxRevenue = Math.max(...top.map((item) => Number(item.revenue || 0)), 1);
  const topRevenue = top.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const topShare = totalRevenue ? (topRevenue / totalRevenue) * 100 : 0;

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-7">
      {reportOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#0d1c2e]">Top Customers Report</h3>
                <p className="text-sm text-[#464555]">
                  Top 5 customers contribute {topShare.toFixed(1)}% of total revenue.
                </p>
              </div>
              <button className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]" onClick={() => setReportOpen(false)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {top.map((customer, index) => {
                const revenue = Number(customer.revenue || 0);
                const share = totalRevenue ? (revenue / totalRevenue) * 100 : 0;

                return (
                  <div className="rounded-lg border border-[#c7c4d8] p-4" key={customer.CustomerID || index}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-[#0d1c2e]">Customer {customer.CustomerID}</p>
                        <p className="text-sm text-[#464555]">{customer.Country}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#3525cd]">{formatCurrency(revenue)}</p>
                        <p className="text-xs text-[#464555]">{share.toFixed(2)}% share</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-lg bg-[#f8f9ff] p-4 text-sm leading-6 text-[#464555]">
              Prioritaskan customer dengan revenue tinggi untuk retention, account management,
              dan loyalty program agar kontribusi revenue tetap stabil.
            </div>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Top Customers by Revenue
        </h3>
        <button
          className="text-sm font-semibold text-[#3525cd] transition hover:underline"
          onClick={() => setReportOpen(true)}
          type="button"
        >
          View Report
        </button>
      </div>
      <div className="space-y-5">
        {top.map((customer, index) => {
          const revenue = Number(customer.revenue || 0);
          const share = totalRevenue ? (revenue / totalRevenue) * 100 : 0;

          return (
            <div className="space-y-2" key={customer.CustomerID || index}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-[#464555]">
                  Customer {customer.CustomerID}
                </span>
                <span className="font-bold text-[#0d1c2e]">
                  {formatCurrency(revenue)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#e6eeff]">
                <div
                  className="h-full rounded-full bg-[#3525cd]"
                  style={{
                    opacity: 1 - index * 0.12,
                    width: `${Math.max((revenue / maxRevenue) * 100, 5)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-[#464555]">
                {share.toFixed(2)}% of total revenue · {number.format(Number(customer.orders || 0))} orders
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RepeatRevenueDistribution({ customers, totalRevenue }) {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const oneTimeRevenue = customers
    .filter((customer) => Number(customer.orders || 0) <= 1)
    .reduce((sum, customer) => sum + Number(customer.revenue || 0), 0);
  const repeatRevenue = customers
    .filter((customer) => Number(customer.orders || 0) > 1)
    .reduce((sum, customer) => sum + Number(customer.revenue || 0), 0);
  const data = [
    { name: "Repeat Customers", revenue: repeatRevenue },
    { name: "One-time Customers", revenue: oneTimeRevenue },
  ];
  const repeatShare = totalRevenue ? (repeatRevenue / totalRevenue) * 100 : 0;
  const oneTimeShare = totalRevenue ? (oneTimeRevenue / totalRevenue) * 100 : 0;

  return (
    <div className="flex flex-col rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-5">
      {explanationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-[#0d1c2e]">Repeat vs One-time Revenue</h3>
              <button className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]" onClick={() => setExplanationOpen(false)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm leading-6 text-[#464555]">
              <p>
                Chart ini membandingkan revenue dari customer yang hanya order satu kali dengan
                customer yang sudah melakukan repeat order.
              </p>
              <p>
                Repeat customers saat ini menyumbang <span className="font-bold text-[#3525cd]">{repeatShare.toFixed(1)}%</span>{" "}
                revenue, sedangkan one-time customers menyumbang{" "}
                <span className="font-bold text-[#3525cd]">{oneTimeShare.toFixed(1)}%</span>.
              </p>
              <p>
                Secara bisnis, porsi repeat revenue yang tinggi menandakan retention lebih kuat.
                Jika porsi one-time revenue besar, perusahaan perlu fokus pada reactivation,
                follow-up campaign, atau loyalty program untuk mendorong pembelian berikutnya.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Repeat vs One-time Revenue
        </h3>
        <button
          className="flex items-center gap-2 rounded-lg border border-[#c7c4d8] px-3 py-2 text-xs font-semibold text-[#464555] transition hover:border-[#3525cd] hover:text-[#3525cd]"
          onClick={() => setExplanationOpen(true)}
          type="button"
        >
          <Info size={15} />
          Explain
        </button>
      </div>
      <div className="relative mx-auto h-52 w-full max-w-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="revenue" innerRadius={70} outerRadius={96} paddingAngle={2}>
              {data.map((item, index) => (
                <Cell fill={colors[index]} key={item.name} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#464555]">
            Total Rev
          </span>
          <span className="text-xl font-bold text-[#0d1c2e]">
            {formatCurrency(totalRevenue, true)}
          </span>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {data.map((item, index) => {
          const share = totalRevenue ? (item.revenue / totalRevenue) * 100 : 0;

          return (
            <div className="flex items-center justify-between gap-3" key={item.name}>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                <span className="text-sm text-[#464555]">{item.name} ({share.toFixed(0)}%)</span>
              </div>
              <span className="text-sm font-bold text-[#0d1c2e]">
                {formatCurrency(item.revenue, true)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CountryRevenueBars({ countryRevenue }) {
  const top = countryRevenue.slice(0, 6).map((item) => ({
    country: item.Country,
    revenue: Number(item.revenue || 0),
  }));

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-6">
      <h3 className="mb-6 text-xl font-semibold text-[#0d1c2e]">
        Revenue by Country
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top}>
            <XAxis
              axisLine={false}
              dataKey="country"
              tick={{ fill: "#464555", fontSize: 10, fontWeight: 600 }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Bar dataKey="revenue" fill="#3525cd" radius={[8, 8, 0, 0]}>
              {top.map((item, index) => (
                <Cell fillOpacity={1 - index * 0.1} key={item.country} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PurchaseFrequency({ customers }) {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const buckets = [
    { label: "1", min: 1, max: 1 },
    { label: "2", min: 2, max: 2 },
    { label: "3", min: 3, max: 3 },
    { label: "4", min: 4, max: 4 },
    { label: "5", min: 5, max: 5 },
    { label: "6", min: 6, max: 6 },
    { label: "7", min: 7, max: 7 },
    { label: "8", min: 8, max: 8 },
    { label: "9", min: 9, max: 9 },
    { label: "10+", min: 10, max: Infinity },
  ].map((bucket) => ({
    ...bucket,
    count: customers.filter((customer) => {
      const orders = Number(customer.orders || 0);
      return orders >= bucket.min && orders <= bucket.max;
    }).length,
  }));

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-6">
      {explanationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-[#0d1c2e]">Purchase Frequency</h3>
              <button className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]" onClick={() => setExplanationOpen(false)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm leading-6 text-[#464555]">
              <p>
                Chart ini menunjukkan jumlah customer berdasarkan total order yang pernah dilakukan.
              </p>
              <p>
                Sumbu X menunjukkan frekuensi order per customer, sedangkan angka di atas bar menunjukkan
                berapa banyak customer dalam kelompok frekuensi tersebut.
              </p>
              <p>
                Secara bisnis, chart ini membantu melihat apakah customer base didominasi pembeli satu kali
                atau sudah banyak repeat buyer yang bisa ditargetkan untuk loyalty program.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Purchase Frequency
        </h3>
        <button
          className="flex items-center gap-2 rounded-lg border border-[#c7c4d8] px-3 py-2 text-xs font-semibold text-[#464555] transition hover:border-[#3525cd] hover:text-[#3525cd]"
          onClick={() => setExplanationOpen(true)}
          type="button"
        >
          <Info size={15} />
          Explain
        </button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 28, right: 12, bottom: 8, left: 12 }}>
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "#464555", fontSize: 11, fontWeight: 600 }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) {
                  return null;
                }

                const count = Number(payload[0].value || 0);

                return (
                  <div className="rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 shadow-lg">
                    <p className="text-xs font-semibold text-[#464555]">
                      {label} orders
                    </p>
                    <p className="text-sm font-semibold text-[#3525cd]">
                      Count: {number.format(count)} customers
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" fill="#3525cd" radius={[5, 5, 0, 0]}>
              <LabelList
                dataKey="count"
                formatter={(value) => number.format(value)}
                position="top"
                style={{ fill: "#464555", fontSize: 10, fontWeight: 700 }}
              />
              {buckets.map((bucket) => (
                <Cell fill="#3525cd" key={bucket.label} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function getCustomerActionInsight(customer) {
  const revenue = Number(customer?.revenue || 0);
  const orders = Number(customer?.orders || 0);

  if (revenue >= 50000 && orders >= 10) {
    return {
      title: "High-value repeat customer",
      detail:
        "Customer ini memiliki revenue dan frekuensi order tinggi. Prioritaskan loyalty program, account management, dan early access campaign untuk menjaga retensi.",
      action: "Recommended action: retention priority",
    };
  }

  if (revenue >= 50000 && orders < 10) {
    return {
      title: "High-value but low frequency",
      detail:
        "Customer ini menghasilkan revenue besar dengan frekuensi order relatif rendah. Fokuskan analisis pada average order value dan peluang meningkatkan repeat purchase.",
      action: "Recommended action: increase purchase frequency",
    };
  }

  if (orders >= 10) {
    return {
      title: "Frequent buyer",
      detail:
        "Customer ini sering melakukan order, tetapi revenue per order perlu dipantau. Cocok untuk cross-sell atau bundle strategy agar nilai transaksi meningkat.",
      action: "Recommended action: grow basket size",
    };
  }

  return {
    title: "Low-frequency customer",
    detail:
      "Customer ini belum menunjukkan frekuensi pembelian tinggi. Gunakan campaign reactivation atau rekomendasi produk untuk mendorong pembelian berikutnya.",
    action: "Recommended action: reactivation campaign",
  };
}

function CustomerTable({ countries, year }) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState("all");
  const [minOrders, setMinOrders] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [page, setPage] = useState(1);
  const [jumpPage, setJumpPage] = useState("");
  const pageSize = 10;
  const { data, loading } = useCustomerActivity({
    country: countryFilter,
    minOrders,
    page,
    pageSize,
    query,
    year,
  });
  const visible = data.items || [];
  const totalRows = Number(data.total || 0);
  const totalPages = Math.max(Number(data.total_pages || 1), 1);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  function handleSearch(event) {
    setQuery(event.target.value);
    setPage(1);
  }

  function handleJumpToPage(event) {
    event.preventDefault();
    const targetPage = Math.min(Math.max(Number(jumpPage || 1), 1), totalPages);
    setPage(targetPage);
    setJumpPage("");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#c7c4d8] bg-white shadow-sm lg:col-span-12">
      {selectedCustomer && (
        (() => {
          const insight = getCustomerActionInsight(selectedCustomer);
          const revenue = Number(selectedCustomer.revenue || 0);
          const orders = Number(selectedCustomer.orders || 0);
          const averageOrderValue = orders ? revenue / orders : 0;

          return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-[#0d1c2e]">
                  Customer {selectedCustomer.CustomerID}
                </h3>
                <p className="text-sm text-[#464555]">{selectedCustomer.Country}</p>
              </div>
              <button className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]" onClick={() => setSelectedCustomer(null)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#c7c4d8] p-4">
                <p className="text-xs font-semibold uppercase text-[#464555]">Revenue</p>
                <p className="mt-1 text-xl font-bold text-[#0d1c2e]">{formatCurrency(selectedCustomer.revenue)}</p>
              </div>
              <div className="rounded-lg border border-[#c7c4d8] p-4">
                <p className="text-xs font-semibold uppercase text-[#464555]">Orders</p>
                <p className="mt-1 text-xl font-bold text-[#0d1c2e]">{number.format(Number(selectedCustomer.orders || 0))}</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-[#c7c4d8] p-4">
              <p className="text-xs font-semibold uppercase text-[#464555]">Average Order Value</p>
              <p className="mt-1 text-xl font-bold text-[#0d1c2e]">{formatCurrency(averageOrderValue)}</p>
            </div>
            <div className="mt-4 rounded-lg bg-[#f8f9ff] p-4 text-sm leading-6 text-[#464555]">
              <p className="mb-1 font-bold text-[#0d1c2e]">{insight.title}</p>
              <p>{insight.detail}</p>
              <p className="mt-2 font-semibold text-[#3525cd]">{insight.action}</p>
            </div>
          </div>
        </div>
          );
        })()
      )}
      <div className="flex flex-col gap-4 border-b border-[#c7c4d8] bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Recent Customer Activity
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#464555]" size={18} />
            <input
              className="w-full rounded-lg border border-[#c7c4d8] bg-[#f8f9ff] py-2 pl-10 pr-4 text-sm outline-none focus:border-[#3525cd] sm:w-64"
              onChange={handleSearch}
              placeholder="Search customers..."
              type="text"
              value={query}
            />
          </div>
          <button
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              filtersOpen
                ? "border-[#3525cd] bg-[#3525cd]/5 text-[#3525cd]"
                : "border-[#c7c4d8] text-[#464555] hover:bg-[#e6eeff]"
            }`}
            onClick={() => setFiltersOpen((value) => !value)}
            type="button"
          >
            <Filter size={17} />
            Filter
          </button>
        </div>
      </div>
      {filtersOpen && (
        <div className="grid grid-cols-1 gap-4 border-b border-[#c7c4d8] bg-[#f8f9ff] px-6 py-4 sm:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-[#464555]">
            Country
            <select
              className="mt-2 w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm normal-case text-[#0d1c2e] outline-none"
              onChange={(event) => {
                setCountryFilter(event.target.value);
                setPage(1);
              }}
              value={countryFilter}
            >
              <option value="all">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#464555]">
            Min Orders
            <input
              className="mt-2 w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm normal-case text-[#0d1c2e] outline-none"
              min="0"
              onChange={(event) => {
                setMinOrders(event.target.value);
                setPage(1);
              }}
              placeholder="e.g. 5"
              type="number"
              value={minOrders}
            />
          </label>
          <div className="flex items-end">
            <button
              className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm font-semibold text-[#464555] hover:bg-[#e6eeff]"
              onClick={() => {
                setCountryFilter("all");
                setMinOrders("");
                setPage(1);
              }}
              type="button"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-[#e6eeff]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#464555]">Customer ID</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#464555]">Country</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#464555]">Revenue</th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#464555]">Orders</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#464555]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c7c4d8]">
            {loading && (
              <tr>
                <td className="px-6 py-8 text-center text-sm font-medium text-[#464555]" colSpan={5}>
                  Loading customer activity...
                </td>
              </tr>
            )}
            {!loading && !visible.length && (
              <tr>
                <td className="px-6 py-8 text-center text-sm font-medium text-[#464555]" colSpan={5}>
                  No customers match the selected filters.
                </td>
              </tr>
            )}
            {!loading && visible.map((customer) => {
              const initials = String(customer.CustomerID || "NA").slice(0, 2).toUpperCase();

              return (
                <tr className="transition hover:bg-[#eff4ff]" key={customer.CustomerID}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3525cd]/10 text-xs font-bold text-[#3525cd]">
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0d1c2e]">
                          {customer.CustomerID}
                        </div>
                        <div className="text-xs text-[#464555]">
                          Customer {customer.CustomerID}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#464555]">{customer.Country}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-[#0d1c2e]">
                    {formatCurrency(customer.revenue)}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-[#0d1c2e]">
                    {number.format(Number(customer.orders || 0))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="rounded p-1 text-[#3525cd] transition hover:bg-[#3525cd]/5"
                      onClick={() => setSelectedCustomer(customer)}
                      type="button"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#c7c4d8] bg-[#f8f9ff] px-6 py-4">
        <span className="text-sm text-[#464555]">
          Showing {totalRows ? number.format(start + 1) : 0}-
          {number.format(Math.min(start + visible.length, totalRows))} of {number.format(totalRows)} customers
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="rounded border border-[#c7c4d8] bg-white px-3 py-1 text-sm disabled:opacity-40"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(value - 1, 1))}
            type="button"
          >
            Prev
          </button>
          <span className="min-w-16 text-center text-sm font-bold text-[#3525cd]">
            {currentPage} / {totalPages}
          </span>
          <form className="flex items-center gap-2" onSubmit={handleJumpToPage}>
            <input
              className="h-9 w-16 rounded border border-[#c7c4d8] bg-white px-2 text-center text-sm text-[#0d1c2e] outline-none focus:border-[#3525cd]"
              min="1"
              max={totalPages}
              onChange={(event) => setJumpPage(event.target.value)}
              placeholder="Page"
              type="number"
              value={jumpPage}
            />
            <button
              className="h-9 rounded border border-[#c7c4d8] bg-white px-3 text-sm font-semibold text-[#464555] hover:bg-[#e6eeff]"
              type="submit"
            >
              Go
            </button>
          </form>
          <button
            className="rounded border border-[#c7c4d8] bg-white px-3 py-1 text-sm disabled:opacity-40"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerAnalytics() {
  const { selectedYear, setSelectedYear } = useDashboardYear();
  const years = useDashboardYears();
  const { kpi, loading: kpiLoading } = useKPI(selectedYear);
  const { customers, loading: customersLoading } = useTopCustomers(5000, selectedYear);
  const { data: countryRevenue, loading: countryLoading } = useCountryRevenue(selectedYear);

  const totalRevenue = Number(kpi?.total_revenue || 0);
  const totalCustomers = Number(kpi?.total_customers || 0);
  const avgRevenue = totalCustomers ? totalRevenue / totalCustomers : 0;
  const returningCustomers = customers.filter((customer) => Number(customer.orders || 0) > 1).length;
  const newCustomers = Math.max(totalCustomers - returningCustomers, 0);
  const top5Revenue = customers.slice(0, 5).reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const top5Share = totalRevenue ? (top5Revenue / totalRevenue) * 100 : 0;
  const loyaltyCandidates = useMemo(
    () => customers.filter((customer) => Number(customer.orders || 0) > 5).length,
    [customers]
  );
  const customerCountries = useMemo(
    () => Array.from(new Set(countryRevenue.map((item) => item.Country).filter(Boolean))).sort(),
    [countryRevenue]
  );
  const isLoading = kpiLoading || customersLoading || countryLoading;

  return (
    <DashboardLayout>
      <YearFilter value={selectedYear} years={years} onChange={setSelectedYear} />
      {isLoading && (
        <div className="mb-4 rounded-xl border border-[#c7c4d8] bg-white px-4 py-3 text-sm font-medium text-[#464555]">
          Loading customer analytics from backend...
        </div>
      )}

      <div className="mb-6 flex items-start gap-4 rounded-xl border border-[#3525cd]/20 bg-[#3525cd]/5 p-6">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#4f46e5] text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="mb-1 text-xl font-bold text-[#3525cd]">
            Customer Insights
          </h3>
          <p className="text-base leading-7 text-[#464555]">
            Top 5 customers contribute{" "}
            <span className="font-bold text-[#3525cd]">{top5Share.toFixed(1)}%</span>{" "}
            of revenue. Consider a loyalty program for{" "}
            <span className="font-bold text-[#3525cd]">{number.format(loyaltyCandidates)}</span>{" "}
            customers with order frequency above 5.
          </p>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${customers.length ? "+ data loaded" : "Waiting for API"}`}
          icon={Users}
          label="Total Customers"
          value={number.format(totalCustomers)}
        />
        <MetricCard
          detail={`${totalCustomers ? ((newCustomers / totalCustomers) * 100).toFixed(1) : "0.0"}% of base`}
          icon={UserPlus}
          label="New Customers"
          value={number.format(newCustomers)}
        />
        <MetricCard
          detail={`${totalCustomers ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : "0.0"}% repeat buyers`}
          icon={Repeat}
          label="Returning Customers"
          value={number.format(returningCustomers)}
        />
        <MetricCard
          detail="Derived from total revenue"
          icon={WalletCards}
          label="Avg Revenue / Customer"
          tone="down"
          value={formatCurrency(avgRevenue)}
        />
      </section>

      <section className="mt-6 grid grid-cols-12 gap-5">
        <TopCustomersBars customers={customers} totalRevenue={totalRevenue} />
        <RepeatRevenueDistribution customers={customers} totalRevenue={totalRevenue} />
        <CountryRevenueBars countryRevenue={countryRevenue} />
        <PurchaseFrequency customers={customers} />
        <CustomerTable countries={customerCountries} key={selectedYear} year={selectedYear} />
      </section>

    </DashboardLayout>
  );
}

export default CustomerAnalytics;
