import React from "react";
import { ReportRow } from "../types";

export default function ReportsTable({
  rows, loading,
}: {
  rows: ReportRow[];
  loading: boolean;
}) {
  return (
    <div className="border rounded-2xl p-3 bg-white/90 backdrop-blur background-gradient-to-b from-indigo-50 to-white">

      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">ימים ייחודיים לכל חברה/פרויקט</div>
      </div>
      

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm ">
          <thead className="bg-black/80 text-right sticky top-0 ">
            <tr>
              <TH>חברה</TH>
              <TH>פרויקט</TH>
              <TH>מלא</TH>
              <TH>חצי</TH>
              <TH>סה״כ רשומות</TH>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r, idx) => (
                <tr key={idx} className="border-t text-right hover:bg-neutral-100 transition-colors">
                  <td className="p-2">{r.company}</td>
                  <td className="p-2">{r.project}</td>
                  <td className="p-2">{r.fullCount}</td>
                  <td className="p-2">{r.halfCount}</td>
                  <td className="p-2">{r.logsTotal}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-6 text-center text-neutral-500" colSpan={6}>
                  {loading ? "טוען נתונים..." : "אין נתונים לתאריכים/מסננים שנבחרו"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="p-2 font-medium text-white select-none">
      {children}
    </th>
  );
}
