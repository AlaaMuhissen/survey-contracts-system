import React from "react";
import { Filters } from "../types";

export default function QuickChips({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters)=>void }) {
  const Chip = ({ on, label, onClick }: any) => (
    <button
      onClick={onClick}
      className={
        "text-xs px-2.5 py-1 rounded-full border transition " +
        (on ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-neutral-50")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <Chip
        on={filters.day === "full"}
        label="יום מלא"
        onClick={() => setFilters({ ...filters, day: filters.day === "full" ? "all" : "full" })}
      />
      <Chip
        on={filters.day === "half"}
        label="חצי יום"
        onClick={() => setFilters({ ...filters, day: filters.day === "half" ? "all" : "half" })}
      />
      <Chip
        on={filters.hasFile === "yes"}
        label="עם קובץ"
        onClick={() => setFilters({ ...filters, hasFile: filters.hasFile === "yes" ? "all" : "yes" })}
      />
      <Chip
        on={!!filters.company}
        label={filters.company ? `חברה: ${filters.company}` : "כל החברות"}
        onClick={() => setFilters({ ...filters, company: "", project: "" })}
      />
    </div>
  );
}
