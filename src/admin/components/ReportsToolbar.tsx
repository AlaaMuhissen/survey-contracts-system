import React from "react";
import { Company, Project } from "../types";
import AsyncButton from "./AsyncButton";

export default function ReportsToolbar({
  companies, projects, allProjects,
  companyId, setCompanyId, projectId, setProjectId,
  from, setFrom, to, setTo,
  onLoad, onOpenJson, onDownloadXlsx, loading,
}: {
  companies: Company[];
  projects: Project[];
  allProjects: Project[];
  companyId: string; setCompanyId: (v: string) => void;
  projectId: string; setProjectId: (v: string) => void;
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  onLoad: () => void;
  onOpenJson: () => void;
  onDownloadXlsx: () => void;
  loading: boolean;
}) {
  const projectList = companyId ? projects : (allProjects.length ? allProjects : projects);

  return (
    <div
      className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end
                 sticky top-0 z-10 bg-white/80 backdrop-blur background-gradient-to-b from-indigo-50 to-white
                 rounded-xl p-3 border"
    >
      <div>
        <label className="block text-xs mb-1">חברה</label>
        <select
          className="border rounded-lg px-3 py-2 w-full"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">כל החברות</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs mb-1">פרויקט</label>
        <select
          className="border rounded-lg px-3 py-2 w-full"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={projects.length === 0 && !allProjects.length}
        >
          <option value="">{companyId ? "כל הפרויקטים בחברה" : "כל הפרויקטים"}</option>
          {projectList.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs mb-1">מתאריך</label>
        <input
          type="date"
          className="border rounded-lg px-3 py-2 w-full"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs mb-1">עד תאריך</label>
        <input
          type="date"
          className="border rounded-lg px-3 py-2 w-full"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          className="rounded-lg border px-3 py-2 grow inline-flex items-center gap-2 text-sm
                bg-white backdrop-blur shadow-sm
                transition
                focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
                text-black/80 hover:bg-black/80 hover:text-white"
          onClick={onLoad}
          disabled={loading}
        >
          {loading ? "טוען..." : "הצג בטבלה"}
        </button>
        <AsyncButton
          className="rounded-lg border px-3 py-2 grow inline-flex items-center gap-2 text-sm
                bg-white  backdrop-blur shadow-sm
                transition
                focus:outline-none focus:ring-2 focus:ring-indigo-300/60 
                text-black/80 hover:bg-black/80 hover:text-white"
          onClick={onDownloadXlsx}
        >
          הורד
        </AsyncButton>
      </div>
    </div>
  );
}
