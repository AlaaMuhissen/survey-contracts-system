import React from "react";
import { Company, Project } from "../types";
import AsyncButton from "./AsyncButton";

export default function ProjectManager({
  companies,
  projects,
  projectCompany,
  setProjectCompany,
  newProject,
  setNewProject,
  onAddProject,
  onDeleteProject,
}: {
  companies: Company[];
  projects: Project[];
  projectCompany: string;
  setProjectCompany: (v: string) => void;
  newProject: string;
  setNewProject: (v: string) => void;
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
}) {
  const visibleCompanies = projectCompany
    ? companies.filter((co) => co.id === projectCompany)
    : companies;

  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm background-gradient-to-b from-indigo-50 to-white">
      <div className="mb-3 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <h2 className="font-semibold flex items-center gap-2 text-black/80">
          <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 3v18M3 12h18"/>
          </svg>
          ניהול פרויקטים
        </h2>

        {/* Add project row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            className="border rounded-lg px-3 py-2"
            value={projectCompany}
            onChange={(e) => setProjectCompany(e.target.value)}
          >
            <option value="">כל החברות</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="שם פרויקט"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
          />

          <AsyncButton
            onClick={onAddProject}
            disabled={!projectCompany || !newProject.trim()}
          >
            הוסף
          </AsyncButton>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {visibleCompanies.map((co) => {
          const list = projects.filter((p) => p.companyId === co.id);
          return (
            <div key={co.id} className="rounded-xl border bg-white/70 p-3 background-gradient-to-b from-indigo-50 to-white ">
              <div className="flex items-center justify-between mb-2 bg-black/80 h-12 px-3 rounded-lg">
                <div className="font-semibold text-white">{co.name}</div>
                <div className="text-xs text-neutral-200">{list.length} פרויקטים</div>
              </div>

              {list.length === 0 ? (
                <div className="text-sm text-neutral-500">אין פרויקטים לחברה זו</div>
              ) : (
                <ul className="divide-y max-h-60 overflow-y-auto">
                  {list.map((p) => (
                    <li key={p.id} className="py-2 flex items-center justify-between hover:bg-neutral-100 transition-colors px-2 rounded-lg">
                      <div className="truncate text-black/80">{p.name}</div>
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs
                                     hover:bg-red-50 hover:border-red-200 text-red-600"
                          onClick={() => {
                            if (window.confirm("למחוק את הפרויקט?")) onDeleteProject(p.id);
                          }}
                        >
                          מחק
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
