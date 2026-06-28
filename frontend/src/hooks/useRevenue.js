import { useEffect, useState } from "react";
import api from "../services/api";

export default function useRevenue() {
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/revenue/monthly")
      .then((res) => {
        setRevenueData(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    revenueData,
    loading,
  };
}