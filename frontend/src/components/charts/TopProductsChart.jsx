import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function TopProductsChart({ data }) {

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
        Top Products Revenue
      </h2>

      <ResponsiveContainer
        width="100%"
        height={350}
      >
        <BarChart
          layout="vertical"
          data={data}
        >

          <XAxis type="number" />

          <YAxis
            type="category"
            dataKey="Description"
            width={250}
          />

          <Tooltip />

          <Bar
            dataKey="revenue"
            radius={[0, 6, 6, 0]}
          />

        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}

export default TopProductsChart;