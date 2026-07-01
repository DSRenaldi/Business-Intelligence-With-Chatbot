import { useEffect, useState } from "react";
import api from "../services/api";

function useTopProducts(limit = 10, year = "all") {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/products/top", {
        params: year === "all" ? { limit } : { limit, year },
      })
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit, year]);

  return {
    products,
    loading
  };
}

export default useTopProducts;
