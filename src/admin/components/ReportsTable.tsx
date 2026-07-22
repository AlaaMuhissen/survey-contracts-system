import React, { useCallback } from "react";
import JSZip from "jszip";
import { ReportRow } from "../types";


export default function ReportsTable({
  rows, loading 
}: {
  rows: ReportRow[];
  loading: boolean;
}) {
    const downloadPdfsZip = useCallback(async (r: ReportRow) => {
    try {
      const urls = r.pdfUrls || [];
      if (!urls.length) return;

      const zip = new JSZip();

      await Promise.all(
        urls.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
          const blob = await res.blob();

          // nice filename
          const original = url.split("?")[0].split("/").pop() || "file.pdf";
          zip.file(original, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(zipBlob);
      a.href = objectUrl;
      a.download = `${r.company}_${r.project}_pdfs.zip`.replace(/\s+/g, "_");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error(e);
      alert("שגיאה בהורדת הקבצים");
    }
  }, []);
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
              <TH>מחיר</TH>
              <TH>מלא</TH>
              <TH>חצי</TH>
              <TH>סה״כ שעות</TH>
              <TH>מחיר כללי</TH>
              <TH>קבצים</TH>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((r, idx) => {
                const count = r.pdfUrls?.length || 0;
                return (
                <tr key={idx} className="border-t text-right hover:bg-neutral-100 transition-colors">
                  <td className="p-2">{r.company}</td>
                  <td className="p-2">{r.project}</td>
                  <td className="p-2">{r.projectCost}</td>
                  <td className="p-2">{r.fullCount}</td>
                  <td className="p-2">{r.halfCount}</td>
                  <td className="p-2">{r.logsTotal}</td>
                  <td className="p-2">{r.totalCost}</td>
                  <td className="p-2">
                  <button
                        className="rounded-lg border px-3 py-1.5 text-xs bg-white shadow-sm
                                   hover:bg-black/80 hover:text-white transition
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => downloadPdfsZip(r)}
                        disabled={loading || count === 0}
                        title={count ? `הורד ZIP (${count} קבצים)` : "אין קבצים"}
                      >
                        הורד PDF ZIP{count ? ` (${count})` : ""}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="p-6 text-center text-neutral-500" colSpan={8}>
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