import { useMemo, useState } from "react";
import { Company, Project } from "../types";

function StateIcon({ state }: { state: "all" | "some" | "none" }) {
  if (state === "all") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
        <path d="M8 12.5l2.5 2.5L16 9" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "some") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
        <rect x="7.5" y="11" width="9" height="2" fill="white" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    </svg>
  );
}

export default function CompanyProjectTree({
  companies,
  projectsByCompany,
  companyState,
  toggleCompany,
  toggleProject,
  checkedProjectIds,
  masterState,
  toggleAll,
}: {
  companies: Company[];
  projectsByCompany: Map<string, Project[]>;
  companyState: (companyId: string) => "all" | "some" | "none";
  toggleCompany: (companyId: string) => void;
  toggleProject: (companyId: string, projectId: string) => void;
  checkedProjectIds: string[];
  masterState: "all" | "some" | "none";
  toggleAll: () => void;
}) {
  const [query, setQuery] = useState("");
  const [openCompanies, setOpenCompanies] = useState<Set<string>>(new Set());

  const toggleOpen = (id: string) => {
    setOpenCompanies((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const q = query.trim().toLowerCase();

  const rows = useMemo(() => {
    return companies.map((c) => {
      const projects = projectsByCompany.get(c.id) || [];
      const projectMatches = q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects;
      const companyMatches = !q || c.name.toLowerCase().includes(q);
      if (!companyMatches && projectMatches.length === 0) return null;
      return { company: c, projects, projectsToShow: q ? projectMatches : projects };
    }).filter(Boolean) as { company: Company; projects: Project[]; projectsToShow: Project[] }[];
  }, [companies, projectsByCompany, q]);

  return (
    <div dir="rtl">
      <div
        className="flex items-center gap-2 mb-2 cursor-pointer select-none"
        onClick={toggleAll}
      >
        <span className={masterState === "none" ? "text-neutral-400" : "text-black/80"}>
          <StateIcon state={masterState} />
        </span>
        <span className="text-sm font-semibold">חברות ופרויקטים</span>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש חברה או פרויקט..."
        className="w-full text-sm border rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
      />

      <div className="max-h-56 overflow-y-auto border rounded-lg p-1">
        {rows.length === 0 ? (
          <div className="text-xs text-neutral-400 text-center py-4">אין תוצאות</div>
        ) : (
          rows.map(({ company, projects, projectsToShow }) => {
            const isOpen = openCompanies.has(company.id) || (!!q && projectsToShow.length > 0);
            const state = companyState(company.id);
            return (
              <div key={company.id}>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-neutral-50 text-sm">
                  <button
                    type="button"
                    onClick={() => toggleOpen(company.id)}
                    className={`w-4 h-4 flex items-center justify-center text-neutral-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    aria-label="פתח/סגור"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l-6-6 6-6" transform="scale(-1,1) translate(-24,0)" />
                    </svg>
                  </button>
                  <span
                    className={`shrink-0 cursor-pointer ${state === "none" ? "text-neutral-400" : "text-black/80"}`}
                    onClick={() => toggleCompany(company.id)}
                  >
                    <StateIcon state={state} />
                  </span>
                  <span className="cursor-pointer truncate flex-1" onClick={() => toggleCompany(company.id)}>
                    {company.name}
                  </span>
                  <span className="text-xs text-neutral-400 shrink-0">{projects.length} פרויקטים</span>
                </div>
                {isOpen && projectsToShow.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 pr-9 pl-2 py-1 rounded-lg hover:bg-neutral-50 text-[13px]">
                    <span
                      className={`shrink-0 cursor-pointer ${checkedProjectIds.includes(p.id) ? "text-black/80" : "text-neutral-400"}`}
                      onClick={() => toggleProject(company.id, p.id)}
                    >
                      <StateIcon state={checkedProjectIds.includes(p.id) ? "all" : "none"} />
                    </span>
                    <span className="cursor-pointer truncate" onClick={() => toggleProject(company.id, p.id)}>
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}