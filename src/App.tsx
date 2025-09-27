  import React from "react";
  import { BrowserRouter, Routes, Route } from "react-router-dom";
  import SurveyWorkLog1 from "./SurveyWorkLog1";
import AdminPage from "./admin/pages/AdminPage";
import AdminKeySettings from "./admin/AdminKeySettings";
import AdminCatalogPage from "./admin/pages/AdminCatalogPage";
import ReportsPage from "./admin/pages/ReportPage";




  function App() {
    return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SurveyWorkLog1 />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/catalog" element={<AdminCatalogPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
      </Routes>
    </BrowserRouter>
  );

  }

  export default App;

