import React from "react";
import { Company } from "../types";

export default function CompanyList({
  companies,
  onDelete,
}: {
  companies: Company[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur p-4 shadow-sm background-gradient-to-b from-indigo-50 to-white">
      <div className="mb-3 flex items-center justify-between text-black/80">
        <h2 className="font-semibold flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-70" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7h18M5 7V5h6l2 2h6v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
          חברות
        </h2>
        <div className="text-xs text-neutral-500">{companies.length} רשומות</div>
      </div>

      <div className=" border bg-white/60 max-h-80 overflow-y-auto rounded-lg">
        <table className="min-w-full text-sm ">
          <thead className="text-right sticky top-0 bg-black/80 ">
            <tr>
              <th className="p-2 font-medium text-white">שם חברה</th>
              <th className="p-2 w-28 font-medium text-white">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {companies.length ? companies.map((c) => (
              <tr key={c.id} className="border-t  hover:bg-neutral-100 transition-colors">
                <td className="p-2 text-black/80">{c.name}</td>
                <td className="p-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs
                               hover:bg-red-50 hover:border-red-200 text-red-600"
                    onClick={() => {
                      if (window.confirm("למחוק חברה זו? ייתכן שקיימים פרויקטים המשוייכים אליה.")) onDelete(c.id);
                    }}
                  >
                    מחק
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={2} className="p-8 text-center text-neutral-500">
                  אין חברות עדיין
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
