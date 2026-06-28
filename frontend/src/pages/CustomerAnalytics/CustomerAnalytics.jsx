import {
  Download,
  Filter,
  MoreVertical,
  Repeat,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
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
} from "recharts";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";
import useCountryRevenue from "../../hooks/useCountryRevenue";
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

function useTopCustomers(limit = 5000) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/customers/top", {
        params: { limit },
      })
      .then((res) => setCustomers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit]);

  return { customers, loading };
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
  const top = customers.slice(0, 5);
  const maxRevenue = Math.max(...top.map((item) => Number(item.revenue || 0)), 1);

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Top Customers by Revenue
        </h3>
        <button className="text-sm font-semibold text-[#3525cd]" type="button">
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

function RevenueDistribution({ customers, totalRevenue }) {
  const sorted = customers.map((item) => Number(item.revenue || 0));
  const top20Count = Math.ceil(sorted.length * 0.2);
  const topRevenue = sorted.slice(0, top20Count).reduce((sum, value) => sum + value, 0);
  const middleRevenue = sorted.slice(top20Count, top20Count * 2).reduce((sum, value) => sum + value, 0);
  const remainingRevenue = Math.max(totalRevenue - topRevenue - middleRevenue, 0);
  const data = [
    { name: "Enterprise", revenue: topRevenue },
    { name: "SME", revenue: middleRevenue },
    { name: "Startup", revenue: remainingRevenue },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-5">
      <h3 className="mb-6 text-xl font-semibold text-[#0d1c2e]">
        Revenue Distribution
      </h3>
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
      <h3 className="mb-6 text-xl font-semibold text-[#0d1c2e]">
        Purchase Frequency
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets}>
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fill: "#464555", fontSize: 11, fontWeight: 600 }}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip formatter={(value) => `${number.format(value)} customers`} />
            <Bar dataKey="count" fill="#dae2fd" radius={[5, 5, 0, 0]}>
              {buckets.map((bucket) => (
                <Cell fill={bucket.label === "5" ? "#3525cd" : "#dae2fd"} key={bucket.label} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomerTable({ customers }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filtered = customers.filter((customer) => {
    const searchable = `${customer.CustomerID} ${customer.Country}`.toLowerCase();
    return searchable.includes(query.toLowerCase());
  });
  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  function handleSearch(event) {
    setQuery(event.target.value);
    setPage(1);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#c7c4d8] bg-white shadow-sm lg:col-span-12">
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
          <button className="flex items-center justify-center gap-2 rounded-lg border border-[#c7c4d8] px-4 py-2 text-sm font-semibold text-[#464555] transition hover:bg-[#e6eeff]" type="button">
            <Filter size={17} />
            Filter
          </button>
        </div>
      </div>
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
            {visible.map((customer) => {
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
                    <button className="rounded p-1 text-[#3525cd] transition hover:bg-[#3525cd]/5" type="button">
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
          Showing {filtered.length ? number.format(start + 1) : 0}-
          {number.format(Math.min(start + visible.length, filtered.length))} of {number.format(filtered.length)} customers
        </span>
        <div className="flex items-center gap-2">
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
  const { kpi, loading: kpiLoading } = useKPI();
  const { customers, loading: customersLoading } = useTopCustomers(5000);
  const { data: countryRevenue, loading: countryLoading } = useCountryRevenue();

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
  const isLoading = kpiLoading || customersLoading || countryLoading;

  return (
    <DashboardLayout>
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
        <RevenueDistribution customers={customers} totalRevenue={totalRevenue} />
        <CountryRevenueBars countryRevenue={countryRevenue} />
        <PurchaseFrequency customers={customers} />
        <CustomerTable customers={customers} />
      </section>

      <button className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#3525cd] text-white shadow-2xl transition hover:scale-105 active:scale-95" type="button" aria-label="New analysis">
        <Download size={21} />
      </button>
    </DashboardLayout>
  );
}

export default CustomerAnalytics;
