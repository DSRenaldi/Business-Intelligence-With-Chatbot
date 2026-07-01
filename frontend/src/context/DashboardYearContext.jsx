import { useMemo, useState } from "react";

import { DashboardYearContext } from "./dashboardYearContextValue";


export function DashboardYearProvider({ children }) {
  const [selectedYear, setSelectedYear] = useState("all");
  const value = useMemo(
    () => ({ selectedYear, setSelectedYear }),
    [selectedYear]
  );

  return (
    <DashboardYearContext.Provider value={value}>
      {children}
    </DashboardYearContext.Provider>
  );
}
