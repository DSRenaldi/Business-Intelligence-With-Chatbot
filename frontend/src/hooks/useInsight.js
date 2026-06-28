import { useEffect, useState } from "react";
import api from "../services/api";

export default function useInsight() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/insight/summary")
      .then((res) => {
        setInsight(res.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    insight,
    loading,
  };
}