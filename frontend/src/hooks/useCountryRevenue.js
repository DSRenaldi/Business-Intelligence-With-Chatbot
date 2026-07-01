import { useEffect, useState } from "react";
import api from "../services/api";

function useCountryRevenue(year = "all") {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    api
      .get("/api/countries/revenue", {
        params: year === "all" ? {} : { year },
      })
      .then((res) => {
        setData(res.data);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
      });

  }, [year]);

  return {
    data,
    loading
  };

}

export default useCountryRevenue;
