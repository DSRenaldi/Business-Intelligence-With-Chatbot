import { Routes, Route } from "react-router-dom";

import Overview from "../pages/Overview/Overview";
import CustomerAnalytics from "../pages/CustomerAnalytics/CustomerAnalytics";
import ProductAnalytics from "../pages/ProductAnalytics/ProductAnalytics";
import RevenueAnalytics from "../pages/RevenueAnalytics/RevenueAnalytics";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Overview />}
      />
      <Route
        path="/revenue"
        element={<RevenueAnalytics />}
      />
      <Route
        path="/products"
        element={<ProductAnalytics />}
      />
      <Route
        path="/customers"
        element={<CustomerAnalytics />}
      />
    </Routes>
  );
}

export default AppRoutes;
