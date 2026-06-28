import { Bell, Download, Menu, SlidersHorizontal } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageTitles = {
  "/": "Overview",
  "/revenue": "Revenue Analytics",
  "/products": "Product Analytics",
  "/customers": "Customer Analytics",
};

function Navbar() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#c7c4d8] bg-[#f8f9ff]/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-4 lg:gap-8">
        <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c7c4d8] bg-white text-[#464555] lg:hidden" type="button" aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <h2 className="truncate text-xl font-bold text-[#0d1c2e]">
          {title}
        </h2>
        <div className="hidden items-center gap-3 md:flex">
          <button className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-[#464555] transition hover:text-[#3525cd]" type="button">
            <SlidersHorizontal size={15} />
            Date Range
          </button>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-[#464555] transition hover:text-[#3525cd]" type="button">
            <Download size={15} />
            Export
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-[#464555] transition hover:text-[#3525cd]" type="button" aria-label="Notifications">
          <Bell size={20} />
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full border-2 border-[#f8f9ff] bg-[#ba1a1a]" />
        </button>
        <div className="flex items-center gap-3 border-l border-[#c7c4d8] pl-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-[#0d1c2e]">Alex Thompson</p>
            <p className="text-[10px] font-medium text-[#464555]">
              Chief Strategy Officer
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#c7c4d8] bg-[#d5e3fc] text-sm font-bold text-[#3525cd]">
            AT
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
