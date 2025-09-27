
import React, { useRef, useState ,useEffect} from "react";
import { sendOrQueue, setupOnlineDrain } from "./sendWorkLog";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import SignaturePad, { Stroke, SigMeta } from "./SignaturePad";
import { generateWorkLogPdfBlob, WorkLogForm } from "./WorkLogPDF";
import {
  sendPdfViaWhatsAppNoBackend,
  sendPdfViaEmailNoBackend,
} from "./shareNoBackend";
import { useIsDesktop } from "./useIsDesktop";
import { useCompanies } from "./data/useCompanies";
import { useProjects } from "./data/useProjects";
import AsyncButton from "./admin/components/AsyncButton";
const API_BASE = process.env.REACT_APP_API || "http://localhost:8080";
// להסיר את ההכרזה הכפולה:
const flushFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const flushMicro = () => new Promise<void>((r) => setTimeout(r, 0));
const toISO = (d: Date | undefined | null) => (d ?? new Date()).toISOString().slice(0,10);
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
export default function SurveyWorkLog1() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = useIsDesktop();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
useEffect(() => {
  // כשפריט מהתור מסתנכרן בהצלחה, השרת מחזיר resp.number
  setupOnlineDrain((resp) => {
    if (resp?.number) {
      setForm((s) => ({ ...s, number: resp.number }));
    }
  });
}, []);


// put near other helpers
const INITIAL_FORM: WorkLogForm = {
  src: "מקור",
  number: "",
  date: new Date(),
  company: "",
  companyId: "",
  projectId: "",
  project: "",
  manager: "",
  teamLead: "",
  helper1: "",
  helper2: "",
  workDesc: "",
  notes: "",
  dayType: "full",
};

// full reset (everything)
const resetForm = () => {
  setForm({ ...INITIAL_FORM, date: new Date() });
  setSigManager([]);
  setSigLead([]);
  setSigMeta({ w: 600, h: 120 });
};

// soft reset (keeps company+project so you don’t reselect every time)
const softResetForm = () => {
  setForm(s => ({
    ...INITIAL_FORM,
    date: new Date(),
    companyId: s.companyId,
    company: s.company,
    projectId: s.projectId,
    project: s.project,
  }));
  setSigManager([]);
  setSigLead([]);
  setSigMeta({ w: 600, h: 120 });
};



const [form, setForm] = useState<WorkLogForm>({
    src: "מקור",
    number: "00000",
    date: new Date(),
    company: "",
    companyId: "",
    projectId: "",
    project: "",
    manager: "",
    teamLead: "",
    helper1: "",
    helper2: "",
    workDesc: "",
    notes: "",
    dayType: "full", 
  });

// fetch lists
const {
  companies, loading: coLoading, offline: coOffline, fromCache: coFromCache, refresh: refreshCompanies
} = useCompanies(API_BASE);

const {
  projects, loading: projLoading, offline: projOffline, fromCache: projFromCache, refresh: refreshProjects
} = useProjects(API_BASE, form.companyId);

// small helper to set a single field in the form state
  const setField =
  <K extends keyof WorkLogForm>(k: K) =>
  (v: WorkLogForm[K]) =>
    setForm((s) => ({ ...s, [k]: v }));


// when company changes: set ids + names & reset project
const onChooseCompany = (companyId: string) => {
  const c = companies.find((x) => x.id === companyId);
  setField("companyId")(companyId);
  setField("company")(c?.name || "");
  setField("projectId")("");
  setField("project")("");
};
// כפתור "שמור ל-חברה (Firebase)"
const saveToFirebase = async () => {
  await flushFrame(); await flushMicro();

  // Offline fallback: keep your current queue logic as-is
  if (!navigator.onLine) {
    const blob = await generateWorkLogPdfBlob(form, sigManager, sigLead, sigMeta);
    const { queued } = await sendOrQueue(form, blob);
    alert(queued ? "אופליין — נשמר לתור" : "נשמר בהצלחה.");
    return;
  }

  // 1) Reserve number + seq
  const resp = await fetch(`${API_BASE}/worklogs/next-number`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": localStorage.getItem("adminKey") || "", // remove if endpoint is public
    },
  });
  if (!resp.ok) {
    alert("שגיאה בקבלת מספר סידורי");
    return;
  }
  const { number, seq } = await resp.json();

  // 2) Put number into form state before PDF render
  setForm((s) => ({ ...s, number }));
  await flushFrame(); await flushMicro();

  // 3) Generate PDF ONCE with the final number
  const pdf = await generateWorkLogPdfBlob({ ...form, number }, sigManager, sigLead, sigMeta);

  // 4) Upload ONCE — IMPORTANT: include both number and seq in meta
  const { queued } = await sendOrQueue({ ...form, number, seq }, pdf);
  alert(queued ? "אופליין — נשמר לתור" : "נשמר בהצלחה.");
  resetForm();
};


//   const toInputDate = (d: Date | null | undefined) =>
//   d ? new Date(d).toISOString().slice(0, 10) : "";

// const fromInputDate = (v: string) =>
//   v ? new Date(v + "T00:00:00") : null; // avoid timezone surprises





  // signatures as vector strokes + meta (to keep proportions in PDF)
  const [sigManager, setSigManager] = useState<Stroke[]>([]);
  const [sigLead, setSigLead] = useState<Stroke[]>([]);
  const [sigMeta, setSigMeta] = useState<SigMeta>({ w: 600, h: 120 }); // default; updated by SignaturePad
  const [moreOpen, setMoreOpen] = useState(false);




  const printPage = () => window.print();
const toISO = (d: Date | undefined | null) =>
  (d ?? new Date()).toISOString().slice(0,10);
  const dateStr = toISO(form.date);                // <-- string
const filename = () => `work-log-${dateStr}.pdf`;

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
     resetForm();
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
    resetForm();
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-6 print:bg-white">
      <PrintCSS />
      <div className="mx-auto max-w-[900px] px-3">

  {/* בדסקטופ – כמו שהיה */}
{isDesktop ? (
  <>
        <div className="mb-4 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-semibold">
            יומן עבודה – טופס מדידות
          </h1>
        </div>
  <div className="flex gap-2 mb-4">
    {/* <button
      onClick={() => {
        const d = new Date().toLocaleDateString("he-IL");
        setForm((s) => ({ ...s, date: d }));
      }}
      className="rounded-xl border px-3 py-1 hover:bg-neutral-50"
    >
      תאריך להיום
    </button> */}

    <AsyncButton onClick={printPage} >
      הדפס
    </AsyncButton>
    <AsyncButton onClick={downloadVectorPDF} >
      הורד PDF
    </AsyncButton>
    <AsyncButton onClick={sendWhatsApp} >
      שלח בוואטסאפ
    </AsyncButton>
    <AsyncButton onClick={sendEmail} >
      שלח במייל
    </AsyncButton>
    <AsyncButton onClick={saveToFirebase} >
      שמור
    </AsyncButton>
  </div>
  </>
) : null}

        <RegularForm
          form={form}
          setField={setField}
          sigManager={sigManager}
          setSigManager={setSigManager}
          sigLead={sigLead}
          setSigLead={setSigLead}
          setSigMeta={setSigMeta}

          /* new props for the phone form */
          companies={companies}
          coLoading={coLoading}
          coOffline={coOffline}
          coFromCache={coFromCache}
          refreshCompanies={refreshCompanies}
          projects={projects}
          projLoading={projLoading}
          projOffline={projOffline}
          projFromCache={projFromCache}
          refreshProjects={refreshProjects}
          onChooseCompany={onChooseCompany}
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
                <DatePicker
                  selected={form.date}                         // Date
                  onChange={(d) => setField('date')(d || new Date())}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  className="w-40 bg-transparent border-0 border-b border-black/80 focus:outline-none"
                  calendarStartDay={0}                         // Sunday
                  maxDate={form.date}                             // nicer on mobile if needed
                />

            </div>

            <div className="mb-1 font-semibold">פרטי החברה</div>
            <div className="grid grid-cols-1 gap-3 mb-4">
{/* Desktop selectors toolbar (not printed) */}
<div className="hidden md:flex gap-3 items-end mb-3 print:hidden" dir="rtl">
  <div className="flex-1">
    <div className="text-sm mb-1 flex items-center justify-between">
      <span>חברה</span>
      <span className="text-xs text-neutral-500">
        {coLoading ? "טוען..." : coOffline ? "אופליין" : coFromCache ? "מהזיכרון" : "מעודכן"}
      </span>
    </div>
    <select
      className="w-full rounded-xl border border-neutral-300 px-3 py-2 bg-white focus:outline-none"
      value={form.companyId || ""}
      onChange={(e) => onChooseCompany(e.target.value)}
    >
      <option value="" disabled>בחר חברה...</option>
      {companies.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  </div>

  <div className="flex-1">
    <div className="text-sm mb-1 flex items-center justify-between">
      <span>פרויקט</span>
      <span className="text-xs text-neutral-500">
        {projLoading ? "טוען..." : projOffline ? "אופליין" : projFromCache ? "מהזיכרון" : "מעודכן"}
      </span>
    </div>
    <select
      className="w-full rounded-xl border border-neutral-300 px-3 py-2 bg-white focus:outline-none"
      value={form.projectId || ""}
      onChange={(e) => {
        const id = e.target.value || "";
        const p = projects.find((x) => x.id === id);
        setField("projectId")(id);
        setField("project")(p?.name || "");
      }}
      disabled={!form.companyId || projects.length === 0}
    >
      <option value="" disabled>
        {!form.companyId ? "בחר קודם חברה"
          : projects.length === 0 ? "אין פרויקטים במכשיר"
          : "בחר פרויקט..."}
      </option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  </div>
</div>

              <Line
                label="מנהל עבודה:"
                value={form.manager}
                onChange={setField("manager")}
                placeholder="שם מנהל העבודה"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setField("dayType")("full")}
                className={"border px-4 py-2 " + (form.dayType==="full"?"bg-black/80 text-white rounded-xl":"rounded-xl")}>
                יום מלא
              </button>
              <button onClick={() => setField("dayType")("half")}
                className={"border px-4 py-2 " + (form.dayType==="half"?"bg-black/80 text-white rounded-xl":"rounded-xl")}>
                חצי יום
              </button>
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
      {/* 📱 סרגל תחתון – מובייל בלבד */}
<div className="md:hidden fixed inset-x-0 bottom-0 z-50">
  <div className="mx-auto max-w-[900px] px-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">
    <div className="bg-white border shadow-[0_-6px_20px_rgba(0,0,0,0.08)] rounded-2xl p-2 flex gap-2 items-center">


      {/* שמור – CTA */}
      <AsyncButton
        onClick={saveToFirebase}
        className="flex-[1.4] h-12 rounded-xl  text-base active:scale-[0.99]"
      >
        שמור
      </AsyncButton>

      {/* עוד – פותח דףון */}
      <button
        onClick={() => setMoreOpen(true)}
        className="flex-1 h-12 rounded-xl border bg-black/80 text-white text-base active:scale-[0.99]"
      >
        עוד
      </button>
    </div>
  </div>

  {/* דףון הפעולות */}
  {moreOpen && (
    <div className="fixed inset-0 z-50" onClick={() => setMoreOpen(false)}>
      {/* רקע כהה */}
      <div className="absolute inset-0 bg-black/40" />

      {/* מגירה מלמטה */}
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-neutral-300" />
        <div className="grid grid-cols-2 gap-3 text-right" dir="rtl">
          <AsyncButton
            onClick={() => { setMoreOpen(false); downloadVectorPDF(); }}
            className="h-12 rounded-xl border active:scale-[0.99]"
          >
            הורד PDF
          </AsyncButton>
          <AsyncButton
            onClick={() => { setMoreOpen(false); sendWhatsApp(); }}
            className="h-12 rounded-xl border active:scale-[0.99]"
          >
            שלח בוואטסאפ
          </AsyncButton>
          <AsyncButton
            onClick={() => { setMoreOpen(false); sendEmail(); }}
            className="h-12 rounded-xl border active:scale-[0.99]"
          >
            שלח במייל
          </AsyncButton>
          <AsyncButton
            onClick={() => { setMoreOpen(false); printPage(); }}
            className="h-12 rounded-xl border active:scale-[0.99]"
          >
            הדפס
          </AsyncButton>
        </div>

        <button
          onClick={() => setMoreOpen(false)}
          className="mt-4 w-full h-11 rounded-xl bg-red-500 text-white text-center"
        >
          סגור
        </button>
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

  // ✅ add these:
  companies,
  coLoading,
  coOffline,
  coFromCache,
  refreshCompanies,
  projects,
  projLoading,
  projOffline,
  projFromCache,
  refreshProjects,
  onChooseCompany,
}: {
  form: WorkLogForm;
  setField: <K extends keyof WorkLogForm>(k: K) => (v: WorkLogForm[K]) => void;
  sigManager: Stroke[];
  setSigManager: React.Dispatch<React.SetStateAction<Stroke[]>>;
  sigLead: Stroke[];
  setSigLead: React.Dispatch<React.SetStateAction<Stroke[]>>;
  setSigMeta: (m: SigMeta) => void;

  companies: { id: string; name: string }[];
  coLoading: boolean;
  coOffline: boolean;
  coFromCache: boolean;
  refreshCompanies: () => void;

  projects: { id: string; name: string }[];
  projLoading: boolean;
  projOffline: boolean;
  projFromCache: boolean;
  refreshProjects: () => void;

  onChooseCompany: (companyId: string) => void;
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
            <DatePicker
            selected={form.date}                         // Date
            onChange={(d) => setField('date')(d || new Date())}
            dateFormat="dd/MM/yyyy"
            placeholderText="dd/mm/yyyy"
            className={inputCls}
            calendarStartDay={0}  
            maxDate={form.date}                        // Sunday
            withPortal  = {true}                                // nicer on mobile if needed
          />
        </div>

        </div>
      </section>

      {/* Company */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-base font-semibold mb-2 text-right">פרטי החברה</div>
        <div className="grid grid-cols-1 gap-4">
{/* Company */}
<div>
  <div className={labelCls + " flex items-center justify-between"}>
    <span>חברה</span>
    <span className="text-xs text-neutral-500">
      {coLoading ? "טוען..." : coOffline ? "אופליין" : coFromCache ? "מהזיכרון" : "מעודכן"}
    </span>
  </div>

  <select
    className={inputCls}
    value={form.companyId || ""}
    onChange={(e) => onChooseCompany(e.target.value)}
  >
    <option value="" disabled>בחר חברה...</option>
    {companies.map((c) => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>

  {!coOffline && (
    <button type="button" className="mt-2 text-xs underline" onClick={refreshCompanies}>
      רענן חברות
    </button>
  )}
</div>

{/* Project */}
<div>
  <div className={labelCls + " flex items-center justify-between"}>
    <span>פרויקט</span>
    <span className="text-xs text-neutral-500">
      {projLoading ? "טוען..." : projOffline ? "אופליין" : projFromCache ? "מהזיכרון" : "מעודכן"}
    </span>
  </div>

  <select
    className={inputCls}
    value={form.projectId || ""}
    onChange={(e) => {
      const id = e.target.value || "";
      const p = projects.find((x) => x.id === id);
      setField("projectId")(id);
      setField("project")(p?.name || "");
    }}
    disabled={!form.companyId || projects.length === 0}
  >
    <option value="" disabled>
      {!form.companyId ? "בחר קודם חברה"
        : projects.length === 0 ? "אין פרויקטים במכשיר"
        : "בחר פרויקט..."}
    </option>
    {projects.map((p) => (
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>

  {!projOffline && form.companyId && (
    <button type="button" className="mt-2 text-xs underline" onClick={refreshProjects}>
      רענן פרויקטים
    </button>
  )}

  {/* Optional: free-text override for PDF */}
  <div className="mt-3">
    <div className={labelCls}>שם פרויקט (ל־PDF)</div>
    <input
      className={inputCls}
      value={form.project || ""}
      onChange={(e) => setField("project")(e.target.value)}
      placeholder="יושלם מהבחירה, ניתן לעריכה"
    />
  </div>
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
{/* Work day type */}
<section className="rounded-2xl border bg-white p-4 shadow-sm">
  <div className="text-base font-semibold mb-2 text-right">סוג יום</div>
  <div className="flex gap-2 justify-center ">
    <button
      type="button"
      onClick={() => setField("dayType")("full")}
      className={
        "rounded-xl border px-10 py-2 " +
        (form.dayType === "full" ? "bg-black/80 text-white rounded-xl" : "hover:bg-neutral-50")
      }
    >
      יום מלא
    </button>
    <button
      type="button"
      onClick={() => setField("dayType")("half")}
      className={
        "rounded-xl border px-10 py-2 " +
        (form.dayType === "half" ? "bg-black/80 text-white rounded-xl" : "hover:bg-neutral-50")
      }
    >
      חצי יום
    </button>
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
    