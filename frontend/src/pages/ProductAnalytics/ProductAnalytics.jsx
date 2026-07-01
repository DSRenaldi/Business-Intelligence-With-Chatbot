import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Filter,
  Info,
  Package,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../../layouts/DashboardLayout";
import RevenueTrendChart from "../../components/charts/RevenueTrendChart";
import YearFilter from "../../components/filters/YearFilter";
import api from "../../services/api";
import useDashboardYear from "../../hooks/useDashboardYear";
import useDashboardYears from "../../hooks/useDashboardYears";
import useKPI from "../../hooks/useKPI";
import useRevenue from "../../hooks/useRevenue";
import useTopProducts from "../../hooks/useTopProducts";

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

function getStatus(index, contribution) {
  if (index < 3) return "Best Seller";
  if (contribution >= 5) return "High Growth";
  return "Stable";
}

function useWorstProducts(year = "all") {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/products/worst", {
        params: year === "all" ? {} : { year },
      })
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  return { products, loading };
}

function ProductMetric({ icon: Icon, label, value, detail, tone = "primary" }) {
  const toneClass = {
    green: "bg-green-50 text-green-600",
    primary: "bg-[#e2dfff] text-[#3525cd]",
    yellow: "bg-yellow-50 text-yellow-600",
  }[tone];
  const isLongValue = String(value || "").length > 22;

  return (
    <div className="flex min-h-[160px] flex-col gap-3 rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#464555]">
          {label}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <div
          className={`font-bold leading-tight text-[#0d1c2e] ${
            isLongValue ? "text-lg sm:text-xl" : "text-3xl sm:text-4xl"
          }`}
        >
          {value}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#3525cd]">
          <TrendingUp size={15} />
          <span>{detail}</span>
        </div>
      </div>
    </div>
  );
}

function TopProductsBars({ products, totalRevenue }) {
  const maxRevenue = Math.max(...products.map((item) => Number(item.revenue || 0)), 1);

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Top 10 Products by Revenue
        </h3>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#3525cd]" />
          <span className="text-xs font-medium text-[#464555]">Revenue</span>
        </div>
      </div>
      <div className="space-y-4">
        {products.map((product) => {
          const revenue = Number(product.revenue || 0);
          const contribution = totalRevenue ? (revenue / totalRevenue) * 100 : 0;

          return (
            <div className="grid grid-cols-12 items-center gap-3" key={product.Description}>
              <div className="col-span-12 truncate text-sm font-medium text-[#464555] sm:col-span-3">
                {product.Description}
              </div>
              <div className="col-span-9 h-4 overflow-hidden rounded-full bg-[#e6eeff] sm:col-span-7">
                <div
                  className="h-full rounded-full bg-[#3525cd]"
                  style={{ width: `${Math.max((revenue / maxRevenue) * 100, 5)}%` }}
                />
              </div>
              <div className="col-span-3 text-right text-sm font-bold text-[#0d1c2e] sm:col-span-2">
                {formatCurrency(revenue, true)}
              </div>
              <div className="col-span-12 text-xs text-[#464555] sm:col-start-4 sm:col-span-9">
                {contribution.toFixed(2)}% of total revenue
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContributionDonut({ topProducts, totalRevenue }) {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const topRevenue = topProducts.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const topShare = totalRevenue ? (topRevenue / totalRevenue) * 100 : 0;
  const standardShare = Math.max(100 - topShare, 0) * 0.65;
  const underShare = Math.max(100 - topShare - standardShare, 0);
  const data = [
    { name: "Best Sellers", value: topShare },
    { name: "Standard", value: standardShare },
    { name: "Long Tail", value: underShare },
  ];

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-4">
      {explanationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-[#0d1c2e]">Product Contribution</h3>
              <button
                className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]"
                onClick={() => setExplanationOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm leading-6 text-[#464555]">
              <p>
                Chart ini menunjukkan seberapa besar kontribusi revenue dari Top 10 produk
                dibandingkan total revenue produk.
              </p>
              <p>
                Jika persentase Top 10 terlalu tinggi, bisnis sangat bergantung pada sedikit produk.
                Ini bisa menjadi kekuatan jika produk tersebut stabil, tetapi juga risiko jika demand
                atau stok produk utama terganggu.
              </p>
              <p>
                Gunakan chart ini untuk mengevaluasi konsentrasi revenue, menentukan prioritas stok,
                dan melihat apakah produk standard atau long tail perlu dikembangkan agar revenue
                lebih sehat dan tidak terlalu terkonsentrasi.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Product Contribution
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
      <div className="relative mx-auto h-52 w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={68} outerRadius={94} paddingAngle={2}>
              {data.map((item, index) => (
                <Cell fill={colors[index]} key={item.name} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-[#3525cd]">
            {topShare.toFixed(0)}%
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#464555]">
            Top 10
          </span>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {data.map((item, index) => (
          <div className="flex items-center justify-between gap-3" key={item.name}>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} />
              <span className="text-sm text-[#464555]">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-[#0d1c2e]">
              {item.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TierDistribution({ topProducts, worstProducts }) {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const bestRevenue = topProducts.slice(0, 3).reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const standardRevenue = topProducts.slice(3, 8).reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const longTailRevenue = worstProducts.reduce((sum, item) => sum + Math.abs(Number(item.revenue || 0)), 0);
  const otherRevenue = topProducts.slice(8).reduce((sum, item) => sum + Number(item.revenue || 0), 0);

  return (
    <div className="rounded-xl border border-[#c7c4d8] bg-white p-6 shadow-sm lg:col-span-12">
      {explanationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-[#0d1c2e]">Category Revenue Distribution</h3>
              <button className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]" onClick={() => setExplanationOpen(false)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm leading-6 text-[#464555]">
              <p>
                Card ini menunjukkan seberapa besar revenue tersebar pada kelompok produk:
                best sellers, standard, long tail, dan emerging.
              </p>
              <p>
                Tujuannya adalah membantu melihat apakah revenue terlalu bergantung pada sedikit produk
                atau sudah tersebar sehat di banyak produk.
              </p>
              <p>
                Jika Best Sellers terlalu dominan, prioritasnya adalah menjaga stok produk utama sekaligus
                mengembangkan produk standard/emerging agar risiko ketergantungan menurun.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-[#0d1c2e]">
          Category Revenue Distribution
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
      <div className="grid h-auto min-h-64 grid-cols-1 gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <div className="flex min-h-36 flex-col justify-end rounded-lg bg-[#3525cd] p-5 text-white sm:col-span-2 sm:row-span-2">
          <span className="text-sm font-bold">Best Sellers</span>
          <span className="text-3xl font-bold">{formatCurrency(bestRevenue, true)}</span>
        </div>
        <div className="flex min-h-36 flex-col justify-end rounded-lg bg-[#4f46e5] p-5 text-white sm:row-span-2">
          <span className="text-sm font-bold">Standard</span>
          <span className="text-2xl font-bold">{formatCurrency(standardRevenue, true)}</span>
        </div>
        <div className="flex min-h-28 flex-col justify-end rounded-lg bg-[#3525cd]/60 p-5 text-white">
          <span className="text-sm font-bold">Long Tail</span>
          <span className="text-xl font-bold">{formatCurrency(longTailRevenue, true)}</span>
        </div>
        <div className="flex min-h-28 flex-col justify-end rounded-lg bg-[#3525cd]/35 p-5 text-[#0f0069]">
          <span className="text-sm font-bold">Emerging</span>
          <span className="text-xl font-bold">{formatCurrency(otherRevenue, true)}</span>
        </div>
      </div>
    </div>
  );
}

function ProductTable({ products, totalRevenue }) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusExplanationOpen, setStatusExplanationOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [minContribution, setMinContribution] = useState("");
  const [page, setPage] = useState(1);
  const [jumpPage, setJumpPage] = useState("");
  const pageSize = 10;
  const filteredProducts = products.filter((product, index) => {
    const revenue = Number(product.revenue || 0);
    const contribution = totalRevenue ? (revenue / totalRevenue) * 100 : 0;
    const status = getStatus(index, contribution);
    const matchesSearch = product.Description?.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesContribution = !minContribution || contribution >= Number(minContribution);

    return matchesSearch && matchesStatus && matchesContribution;
  });
  const totalPages = Math.max(Math.ceil(filteredProducts.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + pageSize);
  const displayStart = filteredProducts.length ? startIndex + 1 : 0;
  const displayEnd = Math.min(startIndex + visibleProducts.length, filteredProducts.length);

  function handleQueryChange(event) {
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
      {statusExplanationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-[#0d1c2e]">Performance Status</h3>
              <button
                className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]"
                onClick={() => setStatusExplanationOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm leading-6 text-[#464555]">
              <p>
                Status pada table ini adalah klasifikasi performa produk berdasarkan ranking revenue
                dan kontribusi terhadap total revenue pada filter tahun yang sedang aktif.
              </p>
              <p>
                <span className="font-bold text-[#0d1c2e]">Best Seller</span> berarti produk masuk
                3 besar berdasarkan revenue. Produk ini biasanya menjadi prioritas untuk ketersediaan
                stok dan campaign utama.
              </p>
              <p>
                <span className="font-bold text-[#0d1c2e]">High Growth</span> berarti kontribusi
                revenue produk minimal 5% dari total revenue. Label ini menunjukkan produk dengan
                kontribusi kuat, bukan perhitungan growth month-over-month.
              </p>
              <p>
                <span className="font-bold text-[#0d1c2e]">Stable</span> berarti produk masih
                berkontribusi, tetapi tidak masuk 3 besar dan kontribusinya di bawah threshold utama.
                Produk ini bisa dipantau untuk peluang bundling atau promosi tambahan.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 border-b border-[#c7c4d8] p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-[#0d1c2e]">
            Performance Details
          </h3>
          <button
            className="flex items-center gap-2 rounded-lg border border-[#c7c4d8] px-3 py-2 text-xs font-semibold text-[#464555] transition hover:border-[#3525cd] hover:text-[#3525cd]"
            onClick={() => setStatusExplanationOpen(true)}
            type="button"
          >
            <Info size={15} />
            Status
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#464555]" size={18} />
            <input
              className="w-full rounded-lg border border-[#c7c4d8] bg-[#e6eeff] py-2 pl-10 pr-4 text-sm outline-none focus:border-[#3525cd] sm:w-64"
              onChange={handleQueryChange}
              placeholder="Filter products..."
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
            Status
            <select
              className="mt-2 w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm normal-case text-[#0d1c2e] outline-none"
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              value={statusFilter}
            >
              <option value="all">All Status</option>
              <option value="Best Seller">Best Seller</option>
              <option value="High Growth">High Growth</option>
              <option value="Stable">Stable</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#464555]">
            Min Contribution %
            <input
              className="mt-2 w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm normal-case text-[#0d1c2e] outline-none"
              min="0"
              onChange={(event) => {
                setMinContribution(event.target.value);
                setPage(1);
              }}
              placeholder="e.g. 1"
              type="number"
              value={minContribution}
            />
          </label>
          <div className="flex items-end">
            <button
              className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm font-semibold text-[#464555] hover:bg-[#e6eeff]"
              onClick={() => {
                setStatusFilter("all");
                setMinContribution("");
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
        <table className="w-full min-w-[820px] text-left">
          <thead className="bg-[#eff4ff]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#464555]">Product Name</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#464555]">Revenue</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#464555]">Quantity Sold</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#464555]">Contribution %</th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#464555]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c7c4d8]">
            {visibleProducts.map((product, index) => {
              const revenue = Number(product.revenue || 0);
              const contribution = totalRevenue ? (revenue / totalRevenue) * 100 : 0;
              const status = getStatus(startIndex + index, contribution);

              return (
                <tr className="transition hover:bg-[#eff4ff]" key={product.Description}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e6eeff] text-[#3525cd]">
                        <Package size={18} />
                      </div>
                      <span className="max-w-[340px] truncate text-sm font-bold text-[#0d1c2e]">
                        {product.Description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-[#0d1c2e]">
                    {formatCurrency(revenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-[#0d1c2e]">
                    {number.format(Number(product.quantity_sold || 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-[#0d1c2e]">
                    {contribution.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${
                      status === "Stable"
                        ? "bg-[#e2dfff] text-[#3525cd]"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between bg-[#eff4ff] px-6 py-4">
        <span className="text-sm font-medium text-[#464555]">
          Showing {number.format(displayStart)}-{number.format(displayEnd)} of{" "}
          {number.format(filteredProducts.length)} products
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c7c4d8] bg-white text-[#464555] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(value - 1, 1))}
            type="button"
          >
            <ArrowRight className="rotate-180" size={17} />
          </button>
          <span className="min-w-20 text-center text-sm font-semibold text-[#464555]">
            {currentPage} / {totalPages}
          </span>
          <form className="flex items-center gap-2" onSubmit={handleJumpToPage}>
            <input
              className="h-9 w-16 rounded-lg border border-[#c7c4d8] bg-white px-2 text-center text-sm text-[#0d1c2e] outline-none focus:border-[#3525cd]"
              min="1"
              max={totalPages}
              onChange={(event) => setJumpPage(event.target.value)}
              placeholder="Page"
              type="number"
              value={jumpPage}
            />
            <button
              className="h-9 rounded-lg border border-[#c7c4d8] bg-white px-3 text-sm font-semibold text-[#464555] transition hover:bg-[#e6eeff]"
              type="submit"
            >
              Go
            </button>
          </form>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#c7c4d8] bg-white text-[#464555] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPage === totalPages}
            onClick={() => setPage((value) => Math.min(value + 1, totalPages))}
            type="button"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductAnalysisModal({ onClose, summary }) {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1c2e]/55 p-4">
      <div className="max-h-[86vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#c7c4d8] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-[#0d1c2e]">Product Performance Analysis</h2>
            <p className="text-xs font-medium text-[#464555]">Revenue concentration and portfolio action summary</p>
          </div>
          <button className="rounded-lg p-2 text-[#464555] hover:bg-[#dce9ff]" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[72vh] space-y-5 overflow-y-auto p-6 text-sm text-[#0d1c2e]">
          <section className="rounded-lg bg-[#f8f9ff] p-4">
            <h3 className="mb-2 font-bold text-[#3525cd]">Executive Takeaway</h3>
            <p>
              Top 10 products contribute {summary.top10Share.toFixed(1)}% of total revenue.
              Best selling product is {summary.bestProduct?.Description || "N/A"} with{" "}
              {formatCurrency(summary.bestProduct?.revenue)} revenue.
            </p>
          </section>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#c7c4d8] p-4">
              <h3 className="mb-2 font-bold text-[#3525cd]">Portfolio Health</h3>
              <p>Active products: {number.format(summary.activeProducts)}</p>
              <p>Average product revenue: {formatCurrency(summary.averageProductRevenue)}</p>
              <p>Top 10 revenue: {formatCurrency(summary.top10Revenue)}</p>
            </div>
            <div className="rounded-lg border border-[#c7c4d8] p-4">
              <h3 className="mb-2 font-bold text-[#3525cd]">Risk Signal</h3>
              <p>
                {summary.top10Share >= 40
                  ? "Revenue is concentrated in a small set of best sellers. Monitor stock availability and diversify mid-tier products."
                  : "Revenue concentration is moderate. Continue monitoring product contribution mix."}
              </p>
            </div>
          </section>
          <section>
            <h3 className="mb-2 font-bold text-[#3525cd]">Recommended Actions</h3>
            <ol className="space-y-2">
              <li className="rounded-lg border border-[#c7c4d8] p-3">1. Protect stock and visibility for the highest revenue products.</li>
              <li className="rounded-lg border border-[#c7c4d8] p-3">2. Review worst-performing products for returns, pricing, or assortment issues.</li>
              <li className="rounded-lg border border-[#c7c4d8] p-3">3. Promote promising mid-tier products to reduce dependence on top sellers.</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function ProductAnalytics() {
  const { selectedYear, setSelectedYear } = useDashboardYear();
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const years = useDashboardYears();
  const { kpi, loading: kpiLoading } = useKPI(selectedYear);
  const { products: topProducts, loading: topLoading } = useTopProducts(5000, selectedYear);
  const { products: worstProducts, loading: worstLoading } = useWorstProducts(selectedYear);
  const { revenueData, loading: revenueLoading } = useRevenue(selectedYear);
  const { revenueData: allRevenueData, loading: allRevenueLoading } = useRevenue("all");

  const totalRevenue = Number(kpi?.total_revenue || 0);
  const totalProducts = Number(kpi?.total_products || 0);
  const top10Products = topProducts.slice(0, 10);
  const bestProduct = topProducts[0];
  const averageProductRevenue = totalProducts ? totalRevenue / totalProducts : 0;
  const top10Revenue = top10Products.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const top10Share = totalRevenue ? (top10Revenue / totalRevenue) * 100 : 0;
  const activeProducts = useMemo(() => {
    if (!totalProducts) return 0;
    return Math.max(totalProducts - worstProducts.filter((item) => Number(item.revenue || 0) <= 0).length, 0);
  }, [totalProducts, worstProducts]);
  const isLoading = kpiLoading || topLoading || worstLoading || revenueLoading || allRevenueLoading;

  return (
    <DashboardLayout>
      <YearFilter value={selectedYear} years={years} onChange={setSelectedYear} />
      {analysisOpen && (
        <ProductAnalysisModal
          onClose={() => setAnalysisOpen(false)}
          summary={{
            activeProducts,
            averageProductRevenue,
            bestProduct,
            top10Revenue,
            top10Share,
          }}
        />
      )}

      {isLoading && (
        <div className="mb-4 rounded-xl border border-[#c7c4d8] bg-white px-4 py-3 text-sm font-medium text-[#464555]">
          Loading product analytics from backend...
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ProductMetric
          detail={`${number.format(topProducts.length)} products ranked`}
          icon={Package}
          label="Total Products"
          value={number.format(totalProducts)}
        />
        <ProductMetric
          detail={`${totalProducts ? ((activeProducts / totalProducts) * 100).toFixed(1) : "0.0"}% inventory efficiency`}
          icon={CheckCircle2}
          label="Active Products"
          tone="green"
          value={number.format(activeProducts)}
        />
        <ProductMetric
          detail={`${number.format(Number(bestProduct?.quantity_sold || 0))} units sold`}
          icon={Star}
          label="Best Selling"
          tone="yellow"
          value={bestProduct?.Description || "N/A"}
        />
        <ProductMetric
          detail={`${top10Share.toFixed(1)}% revenue from top 10`}
          icon={CircleDollarSign}
          label="Avg Product Revenue"
          value={formatCurrency(averageProductRevenue, true)}
        />
      </section>

      <section className="mt-6 grid grid-cols-12 gap-5">
        <div className="col-span-12 flex flex-col gap-5 rounded-xl border border-[#c7c4d8] bg-white/80 p-6 shadow-sm backdrop-blur lg:flex-row lg:items-center">
          <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-[#3525cd]/10 text-[#3525cd]">
            <Bot size={32} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-xl font-semibold text-[#0d1c2e]">
              AI Performance Summary
            </h3>
            <p className="text-base leading-7 text-[#464555]">
              Performance analysis complete:{" "}
              <span className="font-bold text-[#3525cd]">
                Top 10 products generate {top10Share.toFixed(1)}% of revenue.
              </span>{" "}
              Consider expanding marketing for mid-tier items to diversify revenue streams.
            </p>
          </div>
          <button
            className="flex items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            onClick={() => setAnalysisOpen(true)}
            type="button"
          >
            <Sparkles size={16} />
            Full Analysis
          </button>
        </div>

        <RevenueTrendChart
          allRevenueData={allRevenueData}
          className="lg:col-span-12"
          height={300}
          revenueData={revenueData}
        />
        <TopProductsBars products={top10Products} totalRevenue={totalRevenue} />
        <ContributionDonut topProducts={top10Products} totalRevenue={totalRevenue} />
        <TierDistribution topProducts={top10Products} worstProducts={worstProducts} />
        <ProductTable products={topProducts} totalRevenue={totalRevenue} />
      </section>
    </DashboardLayout>
  );
}

export default ProductAnalytics;
