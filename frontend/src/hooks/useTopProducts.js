import { useEffect, useState } from "react";
import api from "../services/api";

function useTopProducts(limit = 10) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/products/top", {
        params: { limit },
      })
      .then((res) => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit]);

  return {
    products,
    loading
  };
}

export default useTopProducts;
