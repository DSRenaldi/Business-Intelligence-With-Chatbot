import { Calendar } from "lucide-react";

function YearFilter({ value, years, onChange }) {
  return (
    <div className="mb-5 flex justify-end">
      <label className="flex w-full items-center gap-3 rounded-xl border border-[#c7c4d8] bg-white px-4 py-3 shadow-sm sm:w-auto">
        <Calendar className="text-[#3525cd]" size={18} />
        <span className="text-xs font-semibold uppercase tracking-wide text-[#464555]">
          Year
        </span>
        <select
          className="min-w-32 bg-transparent text-sm font-bold text-[#0d1c2e] outline-none"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          <option value="all">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default YearFilter;
