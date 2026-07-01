import { useEffect, useState } from "react";
import api from "../services/api";

export default function useRevenue(year = "all") {
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/revenue/monthly", {
        params: year === "all" ? {} : { year },
      })
      .then((res) => {
        setRevenueData(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [year]);

  return {
    revenueData,
    loading,
  };
}
