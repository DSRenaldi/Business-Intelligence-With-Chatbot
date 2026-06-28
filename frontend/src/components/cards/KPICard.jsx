function KPICard({
  title,
  value,
}) {
  return (
    <div
      className="
      bg-white
      rounded-xl
      shadow-sm
      border
      p-6
      "
    >
      <p className="text-slate-500 text-sm">
        {title}
      </p>

      <h2
        className="
        text-3xl
        font-bold
        mt-2
        "
      >
        {value}
      </h2>
    </div>
  );
}

export default KPICard;