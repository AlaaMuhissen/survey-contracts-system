import React, { useMemo } from "react";
import { useCatalog } from "../hooks/useCatalog";
import CompanyList from "../components/CompanyList";
import ProjectManager from "../components/ProjectManager";
import AsyncButton from "../components/AsyncButton";

export default function AdminCatalogPage() {
  const adminKey = localStorage.getItem("adminKey") || "";
  const headers = useMemo(
    () => ({ "x-admin-key": adminKey.trim(), "Content-Type": "application/json" }),
    [adminKey]
  );

  const {
    companies, projects,
    newCompany, setNewCompany,
    newProject, setNewProject,
    projectCompany, setProjectCompany,
    addCompany, addProject,
    removeCompany, removeProject,
  } = useCatalog(headers);

  const hasKey = Boolean(adminKey.trim());

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white " dir="rtl">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* Header */}
        <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-black">ניהול קטלוג</h1>
            <p className="text-sm text-neutral-500">חברות ופרויקטים • הוספה, מחיקה וניהול</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Add company card */}
            <section className="lg:col-span-2 rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm background-gradient-to-b from-indigo-50 to-white">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-black/80">
                <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7h18M5 7V5h6l2 2h6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
                הוסף חברה
              </h2>
              <div className="flex gap-2">
                <input
                  className="border rounded-lg px-3 py-2 flex-1"
                  placeholder="שם חברה"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                />
                <AsyncButton
                  className="rounded-lg border px-3 py-2 inline-flex items-center gap-2 text-sm
                bg-white backdrop-blur shadow-sm
                transition
                focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
                text-black/80 hover:bg-black/80 hover:text-white" 
                  onClick={addCompany}
                >
                  הוסף
                </AsyncButton>
              </div>
            </section>

            {/* Companies list */}
            <section className="lg:col-span-3">
              <CompanyList companies={companies} onDelete={removeCompany} />
            </section>

            {/* Projects manager spans full width */}
            <section className="lg:col-span-5">
              <ProjectManager
                companies={companies}
                projects={projects}
                projectCompany={projectCompany}
                setProjectCompany={setProjectCompany}
                newProject={newProject}
                setNewProject={setNewProject}
                onAddProject={addProject}
                onDeleteProject={removeProject}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
