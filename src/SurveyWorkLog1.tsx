
import React, { useRef, useState } from "react";
// ⬇️ no html2canvas/jsPDF needed
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

import SignaturePad, { Stroke, SigMeta } from "./SignaturePad";
import { generateWorkLogPdfBlob, WorkLogForm } from "./WorkLogPDF";
import {
  sendPdfViaWhatsAppNoBackend,
  sendPdfViaEmailNoBackend,
} from "./shareNoBackend";
import { useIsDesktop } from "./useIsDesktop";

// inside SurveyWorkLog1

/* ---------- Print-only CSS & small mobile polish ----------- */
function PrintCSS() {
  return (
    <style>{`
  /* mobile comfort */
  @media (max-width: 768px) {
    html, body { -webkit-text-size-adjust: 100%; }
    input, textarea, button { font-size: 16px; } /* avoid iOS zoom */
    #a4-page { box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
  }

  /* better momentum scroll on iOS */
  body { -webkit-overflow-scrolling: touch; }

  /* ensure signature canvas always receives touches */
  canvas { touch-action: none; }

  /* print page to exact A4 */
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

/* ---------- Small helpers to flush pending state before export/share ---------- */
const flushFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const flushMicro = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

export default function SurveyWorkLog1() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useIsDesktop();
  const flushFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const flushMicro = () => new Promise<void>((r) => setTimeout(r, 0));
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

  const setField =
    (k: keyof WorkLogForm) =>
    (v: string) =>
      setForm((s) => ({ ...s, [k]: v }));

  const printPage = () => window.print();

  const filename = () =>
    `work-log-${(form.date || new Date().toLocaleDateString("he-IL")).replace(
      /\./g,
      "-"
    )}.pdf`;

  const downloadVectorPDF = async () => {
    // ensure last stroke is flushed on mobile
  await flushFrame();
  await flushMicro();
  const blob = await generateWorkLogPdfBlob(form, sigManager, sigLead, sigMeta);
  
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const sendWhatsApp = async () => {
    await flushFrame();
    await flushMicro();

    const blob = await generateWorkLogPdfBlob(
      form,
      sigManager,
      sigLead,
      sigMeta
    );
    await sendPdfViaWhatsAppNoBackend(blob, filename(), {
      // phoneE164: "9725XXXXXXXX", // optional: target number
      messagePrefix: "שלום, זה יומן העבודה להיום.",
    });
  };

  const sendEmail = async () => {
    await flushFrame();
    await flushMicro();

    const blob = await generateWorkLogPdfBlob(
      form,
      sigManager,
      sigLead,
      sigMeta
    );
    await sendPdfViaEmailNoBackend(blob, filename(), {
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
          <h1 className="text-xl font-semibold">
            יומן עבודה – טופס מדידות (React RTL)
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const d = new Date().toLocaleDateString("he-IL");
                setForm((s) => ({ ...s, date: d }));
              }}
              className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
            >
              תאריך להיום
            </button>
            <button
              onClick={printPage}
              className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
            >
              הדפס
            </button>
            <button
              onClick={downloadVectorPDF}
              className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
            >
              הורד PDF
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={downloadVectorPDF}
            className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
          >
            הורד PDF
          </button>
          <button
            onClick={sendWhatsApp}
            className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
          >
            שלח בוואטסאפ
          </button>
          <button
            onClick={sendEmail}
            className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
          >
            שלח במייל
          </button>
        </div>

        {/* 📱 Regular phone form */}
        <RegularForm
          form={form}
          setField={setField}
          sigManager={sigManager}
          setSigManager={setSigManager}
          sigLead={sigLead}
          setSigLead={setSigLead}
          setSigMeta={setSigMeta}
        />
{isDesktop && (
  <div className="md:block">
        {/* 🖥️ Desktop A4 preview */}
        <div className="hidden md:block">
          <div
            id="a4-page"
            ref={pageRef}
            className="relative bg-white shadow-xl border border-black/70 mx-auto p-4 md:p-6 print:shadow-none print:border-black print:mx-auto print:w-[210mm] print:h-[297mm] print:overflow-hidden print:box-border"
            style={{
              width: "100%",
              maxWidth: 900,
              aspectRatio: "210 / 297",
              height: "auto",
            }}
          >
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-black/80 pb-3">
              <div className="w-20 h-20 border border-black/60 rounded-full shrink-0 flex items-center justify-center text-xs">
                לוגו
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold leading-tight">
                  טרווארס מדידות
                </div>
                <div className="text-sm">אל-אנסאר 25, ירושלים</div>
                <div className="text-sm">054-7312492</div>
              </div>
              <div className="shrink-0 text-sm text-right">
                <div className="border border-black/70 px-2 py-1 inline-block mb-2">
                  עוסק מורשה
                  <br />
                  <span className="font-mono">301156782</span>
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
              <Line
                label="חברה:"
                value={form.company}
                onChange={setField("company")}
                placeholder="שם החברה"
              />
              <Line
                label="פרויקט:"
                value={form.project}
                onChange={setField("project")}
                placeholder="שם הפרויקט"
              />
              <Line
                label="מנהל עבודה:"
                value={form.manager}
                onChange={setField("manager")}
                placeholder="שם מנהל העבודה"
              />
            </div>

            <div className="mb-1 font-semibold">פרטי צוות מדידה</div>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <Line
                label="ראש צוות:"
                value={form.teamLead}
                onChange={setField("teamLead")}
                placeholder="שם"
              />
              <Line
                label="עוזר:"
                value={form.helper1}
                onChange={setField("helper1")}
                placeholder="שם"
              />
              <Line
                label="עוזר:"
                value={form.helper2}
                onChange={setField("helper2")}
                placeholder="שם"
              />
            </div>

            <div className="mb-4">
              <LinedArea
                label="תיאור עבודה"
                value={form.workDesc}
                onChange={setField("workDesc")}
                rows={8}
              />
            </div>

            <div className="mb-10">
              <LinedArea
                label="הערות"
                value={form.notes}
                onChange={setField("notes")}
                rows={5}
              />
            </div>

            {/* Signatures */}
            <div className="absolute left-0 right-0 bottom-4 px-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col">
                  <SignaturePad
                    strokes={sigManager}
                    setStrokes={setSigManager}
                    setMeta={setSigMeta}
                    height={160}
                  />
                  <div className="h-0 -mt-[1px] border-t border-black/80" />
                  <div className="mt-1 text-center text-sm">חתימת מנהל</div>
                </div>
                <div className="flex flex-col">
                  <SignaturePad
                    strokes={sigLead}
                    setStrokes={setSigLead}
                    setMeta={setSigMeta}
                    height={160}
                  />
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
        )}
      </div>
    </div>
  );
}

/* ------------------- Regular phone form ------------------- */
function RegularForm({
  form,
  setField,
  sigManager,
  setSigManager,
  sigLead,
  setSigLead,
  setSigMeta,
}: {
  form: WorkLogForm;
  setField: (k: keyof WorkLogForm) => (v: string) => void;
  sigManager: Stroke[];
  setSigManager: React.Dispatch<React.SetStateAction<Stroke[]>>;
  sigLead: Stroke[];
  setSigLead: React.Dispatch<React.SetStateAction<Stroke[]>>;
  setSigMeta: (m: SigMeta) => void;
}) {
  const inputCls =
    "w-full rounded-xl border border-neutral-300 px-3 py-3 text-[16px] leading-6 bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-neutral-400 text-right";
  const labelCls = "text-sm text-neutral-700 mb-1 pr-1 text-right";

  return (
    <form className="space-y-5 md:space-y-6 md:hidden" dir="rtl">
      {/* Header mini-card */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-black/60 flex items-center justify-center text-xs">
              לוגו
            </div>
            <div className="leading-tight text-right">
              <div className="text-lg font-bold">טרווארס מדידות</div>
              <div className="text-xs">אל-אנסאר 25, ירושלים</div>
              <div className="text-xs">054-7312492</div>
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block border px-2 py-1 text-xs">
              עוסק מורשה
              <br />
              <span className="font-mono">301156782</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div>
            <div className={labelCls}>מס'</div>
            <input
              className={inputCls + " text-center"}
              value={form.number}
              inputMode="numeric"
              onChange={(e) => setField("number")(e.target.value)}
            />
          </div>
          <div>
            <div className={labelCls}>תאריך</div>
            <input
              className={inputCls}
              value={form.date || new Date().toLocaleDateString("he-IL")}
              onChange={(e) => setField("date")(e.target.value)}
              placeholder="יום.חודש.שנה"
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      {/* Company */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-base font-semibold mb-2 text-right">פרטי החברה</div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className={labelCls}>חברה</div>
            <input
              className={inputCls}
              value={form.company}
              onChange={(e) => setField("company")(e.target.value)}
            />
          </div>
          <div>
            <div className={labelCls}>פרויקט</div>
            <input
              className={inputCls}
              value={form.project}
              onChange={(e) => setField("project")(e.target.value)}
            />
          </div>
          <div>
            <div className={labelCls}>מנהל עבודה</div>
            <input
              className={inputCls}
              value={form.manager}
              onChange={(e) => setField("manager")(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-base font-semibold mb-2 text-right">
          פרטי צוות מדידה
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className={labelCls}>ראש צוות</div>
            <input
              className={inputCls}
              value={form.teamLead}
              onChange={(e) => setField("teamLead")(e.target.value)}
            />
          </div>
          <div>
            <div className={labelCls}>עוזר</div>
            <input
              className={inputCls}
              value={form.helper1}
              onChange={(e) => setField("helper1")(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <div className={labelCls}>עוזר</div>
            <input
              className={inputCls}
              value={form.helper2}
              onChange={(e) => setField("helper2")(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Work description */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-base font-semibold mb-2 text-right">תיאור עבודה</div>
        <textarea
          className={inputCls + " h-32 resize-y"}
          value={form.workDesc}
          onChange={(e) => setField("workDesc")(e.target.value)}
          placeholder="פרטי העבודה..."
        />
      </section>

      {/* Notes */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-base font-semibold mb-2 text-right">הערות</div>
        <textarea
          className={inputCls + " h-24 resize-y"}
          value={form.notes}
          onChange={(e) => setField("notes")(e.target.value)}
          placeholder="הערות נוספות..."
        />
      </section>

      {/* Signatures — stacked on phones, side-by-side on md+ */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-base font-semibold mb-3 text-right">חתימות</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SignaturePad
              strokes={sigManager}
              setStrokes={setSigManager}
              setMeta={setSigMeta}
              height={160}
            />
            <div className="h-0 -mt-[1px] border-t border-black/80" />
            <div className="mt-1 text-center text-sm">חתימת מנהל</div>
          </div>
          <div>
            <SignaturePad
              strokes={sigLead}
              setStrokes={setSigLead}
              setMeta={setSigMeta}
              height={160}
            />
            <div className="h-0 -mt-[1px] border-t border-black/80" />
            <div className="mt-1 text-center text-sm">חתימת ראש צוות</div>
          </div>
        </div>
      </section>
    </form>
  );
}

/* ------------------- small helpers (same as original) ------------------- */
function Line({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  labelClassName = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div className={`flex gap-2 items-end ${className}`}>
      <label className={`whitespace-nowrap text-sm print:text-[12px]${labelClassName}`}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-right bg-transparent border-0 border-b border-black/80 focus:outline-none focus:ring-0 min-h-[40px] px-2 py-2 text-base"
      />
    </div>
  );
}

function LinedArea({
  label,
  value,
  onChange,
  rows = 6,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
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
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${
            lineHeight - 1
          }px, rgba(0,0,0,0.7) ${lineHeight - 1}px, rgba(0,0,0,0.7) ${lineHeight}px)`,
          backgroundSize: "100% 100%",
        }}
        className="w-full bg-transparent outline-none resize-none p-2"
      />
    </div>
  );
}
    