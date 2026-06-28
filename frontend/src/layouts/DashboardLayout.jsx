import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2e]">
      <Sidebar />
      <div className="min-h-screen lg:pl-[260px]">
        <Navbar />
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
