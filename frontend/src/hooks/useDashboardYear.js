import { useContext } from "react";

import { DashboardYearContext } from "../context/dashboardYearContextValue";

function useDashboardYear() {
  const context = useContext(DashboardYearContext);

  if (!context) {
    throw new Error("useDashboardYear must be used inside DashboardYearProvider");
  }

  return context;
}

export default useDashboardYear;
