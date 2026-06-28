import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function RevenueChart({ data }) {
  return (
    <div
      className="
      bg-white
      rounded-xl
      border
      shadow-sm
      p-6
      "
    >
      <h2
        className="
        text-xl
        font-semibold
        mb-4
        "
      >
        Revenue Trend
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="month"
          />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="revenue"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;