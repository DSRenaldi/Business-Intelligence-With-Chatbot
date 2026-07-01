import { useEffect, useState } from "react";
import api from "../services/api";

function useDashboardYears() {
  const [years, setYears] = useState([]);

  useEffect(() => {
    api
      .get("/api/years")
      .then((res) => setYears(res.data))
      .catch(console.error);
  }, []);

  return years;
}

export default useDashboardYears;
