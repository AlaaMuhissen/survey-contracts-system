import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SurveyWorkLog1 from "./worker/SurveyWorkLog1";
import AdminPage from "./admin/pages/AdminPage";
import AdminCatalogPage from "./admin/pages/AdminCatalogPage";
import ReportsPage from "./admin/pages/ReportPage";
import SurveyEditPage from "./admin/pages/SurveyEditPage";
import WorkersPage from "./admin/pages/WorkersPage";
import WorkerLockScreen from "./worker/pages/WorkerLockScreen";
import ManagerSignPage from "./worker/pages/ManagerSignPage";

import FieloStartLoginPage from "./FieloStartLoginPage";
import PendingSignaturesPage from "./worker/pages/Pendingsignaturespage";
import MyWorklogsPage from "./worker/pages/Myworklogspage";




  function App() {
  const sid = typeof window !== "undefined" ? localStorage.getItem("surveyId") : null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public/user area – choose your preferred path: */}
        {/* Keep root as-is OR also add a survey-scoped variant */}
         <Route path="/" element={<FieloStartLoginPage />} />
        <Route path="/worker/login" element={<WorkerLockScreen />} />
        <Route path="/:surveyId/sign/:token" element={<ManagerSignPage />} />
        <Route path="/:surveyId/pending-signatures" element={<PendingSignaturesPage />} />
        <Route path="/:surveyId/my-worklogs" element={<MyWorklogsPage />} />
        <Route path="/:surveyId" element={<SurveyWorkLog1 />} />
        {/* Example if you want a scoped worklog: */}
        {/* <Route path="/:surveyId/worklog" element={<SurveyWorkLog1 />} /> */}

        {/* Admin login (no surveyId yet) */}
        {/* <Route path="/" element={<LoginPage />} /> */}

        {/* New admin routes with :surveyId */}
        <Route path="/admin/:surveyId" element={<AdminPage />} />
        <Route path="/admin/:surveyId/catalog" element={<AdminCatalogPage />} />
        <Route path="/admin/:surveyId/reports" element={<ReportsPage />} />
        <Route path="/admin/:surveyId/profile" element={<SurveyEditPage />} />
        <Route path="/admin/:surveyId/workers" element={<WorkersPage />} />

        {/* Backward compatibility: old /admin → redirect if we know sid */}
        <Route
          path="/admin"
          element={
            sid ? <Navigate to={`/admin/${encodeURIComponent(sid)}`} replace /> : <Navigate to="/" replace />
          }
        />
        {/* Old unscoped pages → redirect similarly if desired */}
        <Route
          path="/admin/catalog"
          element={
            sid ? <Navigate to={`/admin/${encodeURIComponent(sid)}/catalog`} replace /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/admin/reports"
          element={
            sid ? <Navigate to={`/admin/${encodeURIComponent(sid)}/reports`} replace /> : <Navigate to="/" replace />
          }
        />
        <Route
          path="/admin/myCompany"
          element={
            sid ? <Navigate to={`/admin/${encodeURIComponent(sid)}/myCompany`} replace /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

  export default App;