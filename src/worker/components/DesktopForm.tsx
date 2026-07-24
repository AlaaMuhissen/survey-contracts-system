import DatePicker from "react-datepicker";
import SurveyHeaderBand from "./SurveyHeaderBand";
import Line from "./Line";
import LinedArea from "./LinedArea";
import SignaturePad, { SigMeta, Stroke } from "./SignaturePad";
import { WorkLogForm } from "../utils/pdf/WorkLogPDF";
import { useEffect, useRef } from "react";

function IconRefresh() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" />
    </svg>
  );
}

function StatusPill({ loading, offline, fromCache }: { loading: boolean; offline: boolean; fromCache: boolean }) {
  const label = loading ? "טוען..." : offline ? "אופליין" : fromCache ? "מהזיכרון" : "מעודכן";
  const tone = loading
    ? "bg-neutral-100 text-neutral-500"
    : offline
      ? "bg-amber-100 text-amber-700"
      : fromCache
        ? "bg-neutral-100 text-neutral-500"
        : "bg-emerald-100 text-emerald-700";
  return <span className={`text-[11px] rounded-full px-2 py-0.5 ${tone}`}>{label}</span>;
}

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
  privateClients,
  pcLoading,
  pcOffline,
  pcFromCache,
  refreshPrivateClients,
  onChoosePrivateClient,
  onToggleMode,
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
  privateClients: { id: string; name: string }[];
  pcLoading: boolean;
  pcOffline: boolean;
  pcFromCache: boolean;
  refreshPrivateClients: () => void;
  onChoosePrivateClient: (privateClientId: string) => void;
  onToggleMode: (nextIsPrivate: boolean) => void;
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
        <div className="hidden md:block bg-gradient-to-b from-indigo-50/60 to-transparent print:bg-transparent py-6 print:py-0">
          <div
            id="a4-page"
            ref={pageRef}
            className="relative bg-white shadow-2xl ring-1 ring-black/5 border border-black/70 mx-auto p-4 md:p-6 print:shadow-none print:border-black print:mx-auto print:w-[210mm] print:h-[297mm] print:overflow-hidden print:box-border"
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
              <div className="flex items-end gap-3" />
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

            <div className="mb-2 flex items-center justify-between print:hidden">
              <span className="text-sm font-semibold text-black/80">{form.isPrivate ? "שירות פרטי" : "פרטי החברה"}</span>
              <div className="flex gap-1 rounded-xl border bg-neutral-50 p-1">
                <button
                  type="button"
                  onClick={() => onToggleMode(false)}
                  className={
                    "text-xs rounded-lg px-3 py-1.5 transition font-medium " +
                    (!form.isPrivate ? "bg-black text-white shadow-sm" : "text-black/60 hover:bg-neutral-100")
                  }
                >
                  חברה / פרויקט
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMode(true)}
                  className={
                    "text-xs rounded-lg px-3 py-1.5 transition font-medium " +
                    (form.isPrivate ? "bg-black text-white shadow-sm" : "text-black/60 hover:bg-neutral-100")
                  }
                >
                  שירות פרטי
                </button>
              </div>
            </div>
            <div className="mb-1 font-semibold hidden print:block">
              {form.isPrivate ? "שירות פרטי" : "פרטי החברה"}
            </div>
            <div className="grid grid-cols-1 gap-3 mb-4">
            {/* Desktop selectors toolbar (not printed) */}
            <div className="hidden md:flex gap-3 items-end mb-3 print:hidden" dir="rtl">
            {form.isPrivate ? (
              <div className="flex-1">
                <div className="text-sm mb-1 flex items-center justify-between">
                  <span className="text-neutral-600">שם לקוח</span>
                  {errors.privateClientName && <div className="text-xs text-red-600 mt-1">{errors.privateClientName}</div>}
                  <StatusPill loading={pcLoading} offline={pcOffline} fromCache={pcFromCache} />
                </div>
                <select
                  className={"w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/60" + (errors.privateClientName ? " border-red-500" : "")}
                  value={form.privateClientId || ""}
                  onChange={(e) => onChoosePrivateClient(e.target.value)}
                >
                  <option value="">בחר לקוח קיים...</option>
                  {privateClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {!pcOffline && (
                  <button type="button" className="mt-1.5 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline" onClick={refreshPrivateClients}>
                    <IconRefresh /> רענן לקוחות
                  </button>
                )}
              </div>
            ) : (
              <>
              <div className="flex-1">
                <div className="text-sm mb-1 flex items-center justify-between">
                  <span className="text-neutral-600">חברה</span>
                  {errors.company && <div className="text-xs text-red-600 mt-1">{errors.company}</div>}
                  <StatusPill loading={coLoading} offline={coOffline} fromCache={coFromCache} />
                </div>
                <select
                  required
                  className={"w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/60" + (errors.company ? " border-red-500" : "")}
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
                  <span className="text-neutral-600">פרויקט</span>
                  {errors.project && <div className="text-xs text-red-600 mt-1">{errors.project}</div>}
                  <StatusPill loading={projLoading} offline={projOffline} fromCache={projFromCache} />
                </div>
                <select
                  required
                  className={`w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/60 ${errors.project ? " border-red-500" : ""}`}
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
              </>
            )}
            </div>

            {form.isPrivate && (
              <Line
                label="שם לקוח (ל-PDF):"
                value={form.privateClientName || ""}
                onChange={(v) => {
                  setField("privateClientId")("");
                  setField("privateClientName")(v);
                }}
                placeholder="שם הלקוח"
                required
                errors={errors.privateClientName}
              />
            )}
              <Line
                label="מנהל עבודה:"
                value={form.manager}
                onChange={setField("manager")}
                placeholder="שם מנהל העבודה"
                required
                errors={errors.manager}
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl border bg-neutral-50 p-1 w-fit print:hidden">
              <button onClick={() => setField("dayType")("full")}
                className={"px-4 py-1.5 rounded-lg text-sm font-medium transition " + (form.dayType==="full" ? "bg-black text-white shadow-sm" : "text-black/60 hover:bg-neutral-100")}>
                יום מלא
              </button>
              <button onClick={() => setField("dayType")("half")}
                className={"px-4 py-1.5 rounded-lg text-sm font-medium transition " + (form.dayType==="half" ? "bg-black text-white shadow-sm" : "text-black/60 hover:bg-neutral-100")}>
                חצי יום
              </button>
            </div>
            <div className="hidden print:block text-sm mt-1">
              סוג יום: {form.dayType === "half" ? "חצי יום" : "יום מלא"}
            </div>


            <div className="mb-1 font-semibold mt-3 pb-1 border-b border-neutral-200">פרטי צוות מדידה</div>
            <div className="grid grid-cols-1 gap-3 mb-4 mt-2">
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
                 
        <div className="text-base font-semibold mb-2 pb-1 border-b border-neutral-200 text-right">תיאור עבודה</div>
          {errors.workDesc && <div className="text-xs text-red-600 mt-0.9 mr-22 mb-2">{errors.workDesc}</div>}
        <div className="flex flex-wrap gap-2">
          {workDescription.map(opt => {
          const active = selectedWorkDescription.includes(opt.id);


          return (
            <button
              key={opt.id}
              type="button"
              className={`
                  inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                  border transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-indigo-300/60

                  ${
                    active
                      ? "bg-black text-white border-black shadow-sm"
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
              {active && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
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
                  <div className={errors.sigManager ? "rounded-xl ring-2 ring-red-500" : ""}>
                    <SignaturePad
                      strokes={sigManager}
                      setStrokes={setSigManager}
                      setMeta={setSigMeta}
                      height={160}
                    />
                  </div>
                  <div className="h-0 -mt-[1px] border-t border-black/80" />
                  <div className="mt-1 text-center text-sm">חתימת מנהל</div>
                  {errors.sigManager && (
                    <div className="text-xs text-red-600 text-center mt-0.5">{errors.sigManager}</div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className={errors.sigLead ? "rounded-xl ring-2 ring-red-500" : ""}>
                    <SignaturePad
                      strokes={sigLead}
                      setStrokes={setSigLead}
                      setMeta={setSigMeta}
                      height={160}
                    />
                  </div>
                  <div className="h-0 -mt-[1px] border-t border-black/80" />
                  <div className="mt-1 text-center text-sm">חתימת ראש צוות</div>
                  {errors.sigLead && (
                    <div className="text-xs text-red-600 text-center mt-0.5">{errors.sigLead}</div>
                  )}
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