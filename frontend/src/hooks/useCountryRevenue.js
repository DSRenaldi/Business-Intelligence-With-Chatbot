import { useEffect, useState } from "react";
import api from "../services/api";

function useCountryRevenue() {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    api
      .get("/api/countries/revenue")
      .then((res) => {
        setData(res.data);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });

  }, []);

  return {
    data,
    loading
  };

}

export default useCountryRevenue;