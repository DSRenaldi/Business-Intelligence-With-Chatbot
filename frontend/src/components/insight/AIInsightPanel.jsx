function AIInsightPanel({ insight }) {

  if (!insight) return null;

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
      <h2 className="text-xl font-bold mb-6">
        🧠 AI Business Insight
      </h2>

      <div className="grid md:grid-cols-3 gap-4 mb-6">

        <div>
          <p className="text-gray-500">
            Revenue Growth
          </p>

          <h3 className="text-3xl font-bold">
            {insight.revenue_growth}%
          </h3>
        </div>

        <div>
          <p className="text-gray-500">
            Top Country
          </p>

          <h3 className="text-xl font-semibold">
            {insight.top_country}
          </h3>
        </div>

        <div>
          <p className="text-gray-500">
            Top Product
          </p>

          <h3 className="text-xl font-semibold">
            {insight.top_product}
          </h3>
        </div>

      </div>

      <div
        className="
        bg-indigo-50
        border
        rounded-lg
        p-4
        "
      >
        <p className="font-semibold mb-2">
          Recommendation
        </p>

        <p>
          {insight.recommendation}
        </p>
      </div>
    </div>
  );
}

export default AIInsightPanel;