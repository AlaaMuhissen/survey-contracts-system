import React, { useMemo } from "react";
import { useReports } from "../hooks/useReports";
import ReportsToolbar from "../components/ReportsToolbar";
import ReportsTable from "../components/ReportsTable";

export default function ReportsPage() {
  const adminKey = localStorage.getItem("adminKey") || "";
  const headers = useMemo(
    () => ({ "Content-Type": "application/json", "x-admin-key": adminKey.trim() }),
    [adminKey]
  );

  const {
    companies, projects, allProjects,
    companyId, setCompanyId,
    projectId, setProjectId,
    from, setFrom, to, setTo,
    report, loading, err, setErr,
    loadReport, openJson, downloadXlsx,
  } = useReports(headers);
  const hasKey = Boolean(adminKey.trim());

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

           {!hasKey ? (
          <div className="p-6 text-center">
            <div className="inline-block p-5 border rounded-2xl bg-white/90  backdrop-blur">
              <div className="mb-2">אין מפתח מנהל</div>
              <div>היכנס דרך <a className="underline" href="/admin">/admin</a> ואז חזור לכאן.</div>
            </div>
          </div>
        ) : (
          <>
       
      <ReportsToolbar
        companies={companies}
        projects={projects}
        allProjects={allProjects}
        companyId={companyId}
        setCompanyId={setCompanyId}
        projectId={projectId}
        setProjectId={setProjectId}
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
      </>
    )}
    </div>
    </div>
  );
}


