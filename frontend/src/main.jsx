import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import "./index.css";

import App from "./App";
import { DashboardYearProvider } from "./context/DashboardYearContext";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <DashboardYearProvider>
        <App />
      </DashboardYearProvider>
    </BrowserRouter>
  </React.StrictMode>
);
