import React, { useMemo, useState } from "react";
import { Filters } from "../types";

export default function Toolbar({
  filters, setFilters, onServerSearch, counts,
  companyOptions, projectOptions,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  onServerSearch: () => void;
  counts: { shown: number; total: number };
  companyOptions: string[];
  projectOptions: string[];
}) {
  const [openMobile, setOpenMobile] = useState(false);
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });

 
  const summary = useMemo(() => {
    const parts: string[] = [];
    if (filters.company) parts.push(`חברה: ${filters.company}`);
    if (filters.project) parts.push(`פרויקט: ${filters.project}`);
    if (filters.day && filters.day !== "all") parts.push(filters.day === "half" ? "חצי יום" : "יום מלא");
    if (filters.from || filters.to) parts.push("טווח תאריכים");
    if (filters.number) parts.push(`מס׳ ${filters.number}`);
    return parts.join(" · ") || "ללא מסננים";
  }, [filters]);

  return (
    <div className="sticky top-0 z-20">
      {/* Mobile top bar */}
      <div className="md:hidden mb-2 rounded-xl border bg-white/80 backdrop-blur p-2 shadow-sm">

        <button
          onClick={() => setOpenMobile((v) => !v)}
          className="mt-2 w-full rounded-lg border px-3 py-2 text-sm text-left hover:bg-neutral-50"
          aria-expanded={openMobile}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">{summary}</span>
            <span className={`transition ${openMobile ? "rotate-180" : ""}`}>▾</span>
          </div>
          <div className="mt-1 text-[11px] text-black">
            מציג {counts.shown} מתוך {counts.total}
          </div>
        </button>
      </div>

      {/* Filters grid (always visible on desktop, collapsible on mobile) */}
      <div
        className={[
          "mb-3 grid grid-cols-1 gap-2 md:grid-cols-12 items-end",
          "rounded-xl border bg-white/80  backdrop-blur p-3 shadow-sm",
          "md:block",
          openMobile ? "block" : "hidden md:grid",
        ].join(" ")}
      >

                 {/* row: dates */}
        <div className="md:col-span-2">
          <label className="block text-xs mb-1 text-white/80">מתאריך</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 w-full"
            value={filters.from || ""}
            onChange={(e) => set({ from: e.target.value })}
          />
        </div>

        <div className="md:col-span-2 ">
          <label className="block text-xs mb-1 text-white/80">עד תאריך</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 w-full"
            value={filters.to || ""}
            onChange={(e) => set({ to: e.target.value })}
          />
        </div>
        {/* row: client-side number + company + project */}

        <div className="md:col-span-2 ">
          <label className="block text-xs mb-1 text-white/80">חברה</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={filters.company || ""}
            onChange={(e) => set({ company: e.target.value, project: "" })}
          >
            <option value="">כל החברות</option>
            {companyOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs mb-1 text-white/80">פרויקט</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={filters.project || ""}
            onChange={(e) => set({ project: e.target.value })}
            disabled={projectOptions.length === 0}
          >
            <option value="">{filters.company ? "כל הפרויקטים בחברה" : "כל הפרויקטים"}</option>
            {projectOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* row: team lead + day + hasFile */}
        <div className="md:col-span-2 text-white/80">
          <label className="block text-xs mb-1">ראש צוות</label>
          <input
            className="border rounded-lg px-3 py-2 w-full"
            value={filters.teamLead || ""}
            onChange={(e) => set({ teamLead: e.target.value })}
            placeholder="לדוגמה: דנה"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs mb-1 text-white/80">סוג יום</label>
          <select
            className="border rounded-lg px-3 py-2 w-full"
            value={filters.day || "all"}
            onChange={(e) => set({ day: e.target.value as any })}
          >
            <option value="all">הכל</option>
            <option value="full">יום מלא</option>
            <option value="half">חצי יום</option>
          </select>
        </div>

      


        {/* actions */}
        <div className="md:col-span-4 flex flex-wrap gap-2">
          <button
            className="rounded-lg border px-3 py-2 hover:bg-neutral-50 text-black hover:text-black"
            onClick={() =>
              set({
                number: "", company: "", project: "", teamLead: "",
                day: "all", from: "", to: "", hasFile: "all",
              })
            }
            title="איפוס מסננים"
          >
            נקה מסננים
          </button>

          <div className="text-sm text-neutral-600 self-center md:ml-0">
            מציג {counts.shown} מתוך {counts.total}
          </div>
        </div>
      </div>
    </div>
  );
}
