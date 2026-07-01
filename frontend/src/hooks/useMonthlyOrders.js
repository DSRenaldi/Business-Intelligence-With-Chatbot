import { useEffect, useState } from "react";
import api from "../services/api";

function useMonthlyOrders(year = "all") {
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/orders/monthly", {
        params: year === "all" ? {} : { year },
      })
      .then((res) => setOrdersData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  return { ordersData, loading };
}

export default useMonthlyOrders;
