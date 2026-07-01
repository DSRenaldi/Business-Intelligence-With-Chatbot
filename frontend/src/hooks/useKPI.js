import { useEffect, useState } from "react";
import api from "../services/api";

export default function useKPI(year = "all") {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/kpi", {
        params: year === "all" ? {} : { year },
      })
      .then((res) => {
        setKpi(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [year]);

  return { kpi, loading };
}
