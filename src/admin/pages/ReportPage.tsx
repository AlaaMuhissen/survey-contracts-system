import React, { useEffect, useMemo } from "react";
import { useReports } from "../hooks/useReports";
import ReportsToolbar from "../components/ReportsToolbar";
import ReportsTable from "../components/ReportsTable";
import { useNavigate, useParams } from "react-router-dom";

export default function ReportsPage() {
  
  const { surveyId = "" } = useParams<{ surveyId: string }>();
  const adminKey = localStorage.getItem("adminToken") || "";
  const hasKey = Boolean(adminKey.trim());
  const nav = useNavigate();
  const headers = useMemo(
    () => ({ "Content-Type": "application/json", "authorization": `Bearer ${adminKey.trim()}` }),
    [adminKey]
  );
  
  const {
    companies, projectsByCompany, privateClients,
    checkedCompanyIds, checkedProjectIds,
    companyState, toggleCompany, toggleProject,
    masterCompanyState, toggleAllCompanies,
    checkedPrivateClientIds, togglePrivateClient,
    masterPrivateState, toggleAllPrivateClients,
    from, setFrom, to, setTo,
    report, loading, err,
    loadReport, openJson, downloadXlsx,
  } = useReports(headers , surveyId);

  useEffect(() => {
    if (!hasKey) return;
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKey]);

  return (
  
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white" dir="rtl">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
         <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
         <div>
            <h1 className="text-2xl md:text-3xl font-bold text-black">ניהול דוחות</h1>
            <p className="text-sm text-neutral-500">ימים ייחודיים לכל חברה/פרויקט</p>
          </div>
          <a className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm
                bg-white  backdrop-blur shadow-sm
                transition
                focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
                text-black/80 hover:bg-black/80 hover:text-white"
             href="/admin">
            <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M15 18l-6-6 6-6"/></svg>
            חזרה ללוח
          </a>
          </div>

       
        <ReportsToolbar
          companies={companies}
          projectsByCompany={projectsByCompany}
          privateClients={privateClients}
          checkedCompanyIds={checkedCompanyIds}
          checkedProjectIds={checkedProjectIds}
          companyState={companyState}
          toggleCompany={toggleCompany}
          toggleProject={toggleProject}
          masterCompanyState={masterCompanyState}
          toggleAllCompanies={toggleAllCompanies}
          checkedPrivateClientIds={checkedPrivateClientIds}
          togglePrivateClient={togglePrivateClient}
          masterPrivateState={masterPrivateState}
          toggleAllPrivateClients={toggleAllPrivateClients}
          from={from}
          setFrom={setFrom}
          to={to}
          setTo={setTo}
          onLoad={loadReport}
          onOpenJson={openJson}
          onDownloadXlsx={downloadXlsx}
          loading={loading}
        />

     { err && (
        <div className="text-red-600 text-sm mb-2">{err}</div>
      )}

      <ReportsTable rows={report?.rows || []} loading={loading} />
   
   
    </div>
    </div>
  );
}