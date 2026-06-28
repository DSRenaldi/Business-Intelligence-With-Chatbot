import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Bot
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menus = [
  {
    name: "Overview",
    path: "/",
    icon: LayoutDashboard
  },
  {
    name: "Revenue Analytics",
    path: "/revenue",
    icon: TrendingUp
  },
  {
    name: "Product Analytics",
    path: "/products",
    icon: Package
  },
  {
    name: "Customer Analytics",
    path: "/customers",
    icon: Users
  },
  {
    name: "AI Assistant",
    path: "/chatbot",
    icon: Bot
  }
];

function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 z-50 hidden h-screen w-[260px] flex-col overflow-y-auto border-r border-[#c7c4d8] bg-[#233144] text-white lg:flex"
    >
      <div className="flex items-center gap-4 px-6 py-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4f46e5] text-white">
          <BarChart3 size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight text-[#c3c0ff]">
            Business AI
          </h1>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#c7c4d8]">
            Enterprise BI
          </p>
        </div>
      </div>

      <nav className="flex-1">
        {menus.map((menu) => {
          const Icon = menu.icon;

          return (
            <NavLink
              key={menu.path}
              to={menu.path}
              className={({ isActive }) =>
                `relative flex items-center gap-4 px-6 py-3 text-sm font-medium transition ${
                  isActive
                    ? "border-l-4 border-[#c3c0ff] bg-[#4f46e5] text-white"
                    : "text-[#d5e3fc] hover:bg-[#dae2fd] hover:text-[#131b2e]"
                }`
              }
            >
              <Icon size={19} />
              {menu.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="space-y-4 px-4 py-6">
        <div className="rounded-xl border border-[#4f46e5]/30 bg-[#4f46e5]/10 p-4">
          <p className="mb-3 text-xs font-medium text-[#d5e3fc]">
            Ready for deeper insights?
          </p>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-3 py-2 text-xs font-bold text-white transition hover:shadow-lg active:scale-95">
            <Sparkles size={15} />
            AI Insights
          </button>
        </div>

        <div className="border-t border-white/10 pt-3">
          <a className="flex items-center gap-4 rounded-lg px-4 py-2 text-sm text-[#d5e3fc] transition hover:bg-[#dae2fd] hover:text-[#131b2e]" href="#">
            <Settings size={18} />
            Settings
          </a>
          <a className="flex items-center gap-4 rounded-lg px-4 py-2 text-sm text-[#ffdad6] transition hover:bg-[#ffdad6] hover:text-[#93000a]" href="#">
            <LogOut size={18} />
            Logout
          </a>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
