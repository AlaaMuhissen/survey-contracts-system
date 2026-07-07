import DatePicker from "react-datepicker";
import SurveyHeaderBand from "./SurveyHeaderBand";
import Line from "./Line";
import LinedArea from "./LinedArea";
import SignaturePad, { SigMeta, Stroke } from "./SignaturePad";
import { WorkLogForm } from "../utils/pdf/WorkLogPDF";
import { useEffect, useRef } from "react";

export default function DesktopForm({
  form,
  setField,
  sigManager,
  setSigManager,
  sigLead,
  setSigLead,
  setSigMeta,
  errors,
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
  workDescription,
  selectedWorkDescription,
  setSelectedWorkDescription,

}: {
  form: WorkLogForm;
  setField: <K extends keyof WorkLogForm>(k: K) => (v: WorkLogForm[K]) => void;
  sigManager: Stroke[];
  setSigManager: React.Dispatch<React.SetStateAction<Stroke[]>>;
  sigLead: Stroke[];
  setSigLead: React.Dispatch<React.SetStateAction<Stroke[]>>;
  setSigMeta: (m: SigMeta) => void;
  errors: Record<string, string>;

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
  workDescription: { id: string; name: string }[];
  selectedWorkDescription: string[];
  setSelectedWorkDescription: React.Dispatch<React.SetStateAction<string[]>>;
}) {

    const pageRef = useRef<HTMLDivElement | null>(null);
    const workDescriptionText = workDescription
    .filter(w => selectedWorkDescription.includes(w.id))
    .map(w => w.name)
    .join(", ");
  
  
    useEffect(() => {
      setField("workDesc")(workDescriptionText);
    }, [workDescriptionText]);
    return(
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
            <SurveyHeaderBand workerName={form.teamLead} isItDesktop={true} />

            <div className="flex items-end justify-between mt-3 mb-2">
              <div className="text-sm">מקור</div>
              <div className="text-xl font-semibold">יומן עבודה</div>
              <div className="flex items-end gap-3">
                {/* <div className="text-sm">מס'</div>
                <input
                  value={form.number}
                  onChange={(e) => setField("number")(e.target.value)}
                  className="w-24 text-center bg-transparent border-0 border-b border-black/80 focus:outline-none"
                /> */}
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
                  {errors.company && <div className="text-xs text-red-600 mt-1">{errors.company}</div>}
                  <span className="text-xs text-neutral-500">
                    {coLoading ? "טוען..." : coOffline ? "אופליין" : coFromCache ? "מהזיכרון" : "מעודכן"}
                  </span>
                </div>
                <select
                  required
                  className={"w-full rounded-xl border border-neutral-300 px-3 py-2 bg-white focus:outline-none" + (errors.company ? " border-red-600" : "")}
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
                  {errors.project && <div className="text-xs text-red-600 mt-1">{errors.project}</div>}
                  <span className="text-xs text-neutral-500">
                    {projLoading ? "טוען..." : projOffline ? "אופליין" : projFromCache ? "מהזיכרון" : "מעודכן"}
                  </span>
                </div>
                <select
                  required
                  className={`w-full rounded-xl border border-neutral-300 px-3 py-2 bg-white focus:outline-none ${errors.project ? " border-red-600" : ""}`}
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
                required
                errors={errors.manager}
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


            <div className="mb-1 font-semibold mt-2 ">פרטי צוות מדידה</div>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <Line
                label="ראש צוות:"
                value={form.teamLead}
                onChange={setField("teamLead")}
                placeholder="שם"
                required
                errors={errors.teamLead}
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
                 
        <div className="text-base font-semibold mb-2 text-right">תיאור עבודה</div>
          {errors.workDesc && <div className="text-xs text-red-600 mt-0.9 mr-22 mb-2">{errors.workDesc}</div>}
        <div className="flex flex-wrap gap-2">
          {workDescription.map(opt => {
          const active = selectedWorkDescription.includes(opt.id);


          return (
            <button
              key={opt.id}
              type="button"
              className={`
                  px-4 py-2 rounded-full text-sm font-medium
                  border transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-black/20

                  ${
                    active
                      ? "bg-black/80 text-white border-black shadow-sm"
                      : "bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100"
                  }

                  ${
                    errors.workDesc
                      ? "border-red-500 ring-1 ring-red-200"
                      : ""
                  }
                `}
                onClick={() =>
                  setSelectedWorkDescription(prev =>
                    prev.includes(opt.id)
                      ? prev.filter(x => x !== opt.id)
                      : [...prev, opt.id]
                  )
                }
              >
              {opt.name}
            </button>
          );
          })}
        </div>
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
             
            </div>
          </div>
        </div>
        </div>
    )
}