import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import useCountryRevenue from "../../hooks/useCountryRevenue";

const COLORS = [
  "#4F46E5",
  "#8B5CF6",
  "#06B6D4",
  "#10B981",
  "#F59E0B"
];

function CountryRevenueChart() {

  const { data } = useCountryRevenue();

  const top5 = data.slice(0, 5);

  return (
    <div
      className="
      bg-white
      rounded-xl
      border
      p-6
      h-[400px]
      "
    >
      <h3 className="font-semibold mb-4">
        Revenue by Country
      </h3>

      <ResponsiveContainer
        width="100%"
        height="90%"
      >
        <PieChart>

          <Pie
            data={top5}
            dataKey="revenue"
            nameKey="Country"
            innerRadius={70}
            outerRadius={100}
          >

            {top5.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  COLORS[
                    index %
                    COLORS.length
                  ]
                }
              />
            ))}

          </Pie>

          <Tooltip />

        </PieChart>
      </ResponsiveContainer>

    </div>
  );
}

export default CountryRevenueChart;