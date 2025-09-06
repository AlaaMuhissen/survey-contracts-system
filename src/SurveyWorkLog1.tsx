import React, { useRef, useState } from "react";
// ⬇️ remove html2canvas/jsPDF imports — not needed
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
import SignaturePad, { Stroke, SigMeta } from "./SignaturePad";
import { generateWorkLogPdfBlob, WorkLogForm } from "./WorkLogPDF";
import { sendPdfViaWhatsAppNoBackend, sendPdfViaEmailNoBackend } from "./shareNoBackend";
// ... you already import generateWorkLogPdfBlob

// inside your component:

function PrintCSS() {
  return (
    <style>{`
      @page { size: A4 portrait; margin: 0; }
      @media print {
        html, body, #root { width: 210mm; height: 297mm; margin: 0 !important; padding: 0 !important; }
        body * { visibility: hidden !important; }
        #a4-page, #a4-page * { visibility: visible !important; }
        #a4-page { width: 210mm !important; height: 297mm !important; overflow: hidden !important; box-sizing: border-box; position: fixed !important; top: 0 !important; left: 0 !important; margin: 0 !important; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
  );
}

export default function SurveyWorkLog1() {
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState<WorkLogForm>({
    src: "מקור",
    number: "01190",
    date: "",
    company: "",
    project: "",
    manager: "",
    teamLead: "",
    helper1: "",
    helper2: "",
    workDesc: "",
    notes: "",
  });

  // signatures as vector strokes + meta (to keep proportions in PDF)
  const [sigManager, setSigManager] = useState<Stroke[]>([]);
  const [sigLead, setSigLead] = useState<Stroke[]>([]);
  const [sigMeta, setSigMeta] = useState<SigMeta>({ w: 600, h: 120 }); // default; updated by SignaturePad

  const setField = (k: keyof WorkLogForm) => (v: string) => setForm(s => ({ ...s, [k]: v }));

  const printPage = () => window.print();

  const downloadVectorPDF = async () => {
    const blob = await generateWorkLogPdfBlob(form, sigManager, sigLead, sigMeta);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-log-${(form.date || new Date().toLocaleDateString("he-IL")).replace(/\./g, "-")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const sendWhatsApp = async () => {
  const blob = await generateWorkLogPdfBlob(form, sigManager, sigLead, sigMeta);
  const filename = `work-log-${(form.date || new Date().toLocaleDateString("he-IL")).replace(/\./g, "-")}.pdf`;
  await sendPdfViaWhatsAppNoBackend(blob, filename, {
    // phoneE164: "9725XXXXXXXX", // optional: target number
    messagePrefix: "שלום, זה יומן העבודה להיום.",
  });
};

const sendEmail = async () => {
  const blob = await generateWorkLogPdfBlob(form, sigManager, sigLead, sigMeta);
  const filename = `work-log-${(form.date || new Date().toLocaleDateString("he-IL")).replace(/\./g, "-")}.pdf`;
  await sendPdfViaEmailNoBackend(blob, filename, {
    // to: "client@example.com", // optional
    subject: "יומן עבודה (PDF)",
    bodyPrefix: "שלום,\nמצורף קובץ יומן העבודה.",
  });
};


  return (
    <div className="min-h-screen bg-neutral-100 py-6 print:bg-white">
      <PrintCSS />
      <div className="mx-auto max-w-[900px] px-3">
        <div className="mb-4 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-semibold">יומן עבודה – טופס מדידות (React RTL)</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const d = new Date().toLocaleDateString("he-IL");
                setForm(s => ({ ...s, date: d }));
              }}
              className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
            >
              תאריך להיום
            </button>
            <button onClick={printPage} className="rounded-xl border px-3 py-1 hover:bg-neutral-50">הדפס</button>
            <button onClick={downloadVectorPDF} className="rounded-xl border px-3 py-1 hover:bg-neutral-50">הורד PDF</button>
          </div>
        </div>
           <div className="flex gap-2">
  <button onClick={downloadVectorPDF} className="rounded-xl border px-3 py-1 hover:bg-neutral-50">הורד PDF</button>
  <button onClick={sendWhatsApp} className="rounded-xl border px-3 py-1 hover:bg-neutral-50">שלח בוואטסאפ</button>
  <button onClick={sendEmail} className="rounded-xl border px-3 py-1 hover:bg-neutral-50">שלח במייל</button>
</div>

        {/* Strict A4 page (screen preview) */}
        <div
          id="a4-page"
          ref={pageRef}
          className="relative bg-white shadow-xl border border-black/70 mx-auto w-[794px] h-[1123px] p-6 print:shadow-none print:border-black print:mx-auto print:w-[210mm] print:h-[297mm] print:overflow-hidden print:box-border"
        >
          {/* Header */}
          <div className="flex items-start gap-4 border-b border-black/80 pb-3">
            <div className="w-20 h-20 border border-black/60 rounded-full shrink-0 flex items-center justify-center text-xs">לוגו</div>
            <div className="flex-1">
              <div className="text-2xl font-bold leading-tight">טרווארס מדידות</div>
              <div className="text-sm">אל-אנסאר 25, ירושלים</div>
              <div className="text-sm">054-7312492</div>
            </div>
            <div className="shrink-0 text-sm text-right">
              <div className="border border-black/70 px-2 py-1 inline-block mb-2">
                עוסק מורשה<br /><span className="font-mono">301156782</span>
              </div>
              <div className="text-xs">{form.src}</div>
            </div>
          </div>

          <div className="flex items-end justify-between mt-3 mb-2">
            <div className="text-sm">מקור</div>
            <div className="text-xl font-semibold">יומן עבודה</div>
            <div className="flex items-end gap-3">
              <div className="text-sm">No.</div>
              <input
                value={form.number}
                onChange={(e) => setField("number")(e.target.value)}
                className="w-24 text-center bg-transparent border-0 border-b border-black/80 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end mb-4 gap-2 items-end">
            <div className="text-sm">תאריך</div>
            <input
              value={form.date}
              onChange={(e) => setField("date")(e.target.value)}
              placeholder="יום.חודש.שנה"
              className="w-40 bg-transparent border-0 border-b border-black/80 focus:outline-none"
            />
          </div>

          <div className="mb-1 font-semibold">פרטי החברה</div>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <Line label="חברה:"    value={form.company} onChange={setField("company")} placeholder="שם החברה" />
            <Line label="פרויקט:"  value={form.project} onChange={setField("project")} placeholder="שם הפרויקט" />
            <Line label="מנהל עבודה:" value={form.manager} onChange={setField("manager")} placeholder="שם מנהל העבודה" />
          </div>

          <div className="mb-1 font-semibold">פרטי צוות מדידה</div>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <Line label="ראש צוות:" value={form.teamLead} onChange={setField("teamLead")} placeholder="שם" />
            <Line label="עוזר:"     value={form.helper1} onChange={setField("helper1")} placeholder="שם" />
            <Line label="עוזר:"     value={form.helper2} onChange={setField("helper2")} placeholder="שם" />
          </div>

          <div className="mb-4">
            <LinedArea label="תיאור עבודה" value={form.workDesc} onChange={setField("workDesc")} rows={8} />
          </div>

          <div className="mb-10">
            <LinedArea label="הערות" value={form.notes} onChange={setField("notes")} rows={5} />
          </div>

          {/* Signatures */}
          <div className="absolute left-0 right-0 bottom-4 px-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="flex flex-col">
                <SignaturePad strokes={sigManager} setStrokes={setSigManager} setMeta={setSigMeta} />
                <div className="h-0 -mt-[1px] border-t border-black/80" />
                <div className="mt-1 text-center text-sm">חתימת מנהל</div>
              </div>
              <div className="flex flex-col">
                <SignaturePad strokes={sigLead} setStrokes={setSigLead} setMeta={setSigMeta} />
                <div className="h-0 -mt-[1px] border-t border-black/80" />
                <div className="mt-1 text-center text-sm">חתימת ראש צוות</div>
              </div>
            </div>
          </div>

          {/* Watermark */}
          <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-10 text-[120px] font-black tracking-widest">
            GIS
          </div>

       

        </div>
      </div>
    </div>
  );
}

/* ----- small helpers (same as your original LineInput/LinedArea) ----- */
function Line({
  label, value, onChange, placeholder, className = "", labelClassName = "",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string; labelClassName?: string;
}) {
  return (
    <div className={`flex gap-2 items-end ${className}`}>
      <label className={`whitespace-nowrap text-sm print:text-[12px]${labelClassName}`}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-right bg-transparent border-0 border-b border-black/80 focus:outline-none focus:ring-0"
      />
    </div>
  );
}

function LinedArea({
  label, value, onChange, rows = 6,
}: { label: string; value: string; onChange: (v: string) => void; rows?: number; }) {
  const lineHeight = 30;
  const height = rows * lineHeight + 10;
  return (
    <div>
      <div className="text-sm mb-2">{label}:</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height,
          lineHeight: `${lineHeight}px`,
          backgroundImage:
            `repeating-linear-gradient(to bottom, transparent 0, transparent ${lineHeight - 1}px, rgba(0,0,0,0.7) ${lineHeight - 1}px, rgba(0,0,0,0.7) ${lineHeight}px)`,
          backgroundSize: "100% 100%",
        }}
        className="w-full bg-transparent outline-none resize-none p-2"
      />
    </div>
  );
}
