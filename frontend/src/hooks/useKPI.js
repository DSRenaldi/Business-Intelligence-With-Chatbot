import { useEffect, useState } from "react";
import api from "../services/api";

export default function useKPI() {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/kpi")
      .then((res) => {
        setKpi(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { kpi, loading };
}