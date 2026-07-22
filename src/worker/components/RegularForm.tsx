import DatePicker from "react-datepicker";
import SurveyHeaderBand from "./SurveyHeaderBand";
import SignaturePad, { SigMeta, Stroke } from "./SignaturePad";
import { WorkLogForm } from "../utils/pdf/WorkLogPDF";
import { useEffect } from "react";

export default function RegularForm({
  form,
  setField,
  sigManager,
  setSigManager,
  sigLead,
  setSigLead,
  setSigMeta,
  errors,
  setprofileModalOpen,
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
  setprofileModalOpen: (open: boolean) => void;
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
  const inputCls =
    "w-full rounded-xl border border-neutral-300 px-3 py-3 text-[16px] leading-6 bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-neutral-400 text-right";
  const labelCls = "text-sm text-neutral-700 mb-1 pr-1 text-right flex justify-space-between ";
  const workDescriptionText = workDescription
  .filter(w => selectedWorkDescription.includes(w.id))
  .map(w => w.name)
  .join(", ");


  useEffect(() => {
    setField("workDesc")(workDescriptionText);
  }, [workDescriptionText]);
      
  return (
    <form className="space-y-5 md:space-y-6 md:hidden" dir="rtl">
      {/* Header mini-card */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <SurveyHeaderBand  isItDesktop = {false} workerName= {form.teamLead} setProfileModalOpen={setprofileModalOpen}/>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* <div>
            <div className={labelCls}>מס'</div>
            <input
              className={inputCls + " text-center"}
              value={form.number}
              inputMode="numeric"
              onChange={(e) => setField("number")(e.target.value)}
            />
          </div>
        */}
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

      {/* Company / Private service */}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="text-base font-semibold mb-2 text-right">
          {form.isPrivate ? "שירות פרטי" : "פרטי החברה"}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 justify-center mb-4">
          <button
            type="button"
            onClick={() => onToggleMode(false)}
            className={
              "rounded-xl border px-6 py-2 " +
              (!form.isPrivate ? "bg-black/80 text-white" : "hover:bg-neutral-50")
            }
          >
            חברה / פרויקט
          </button>
          <button
            type="button"
            onClick={() => onToggleMode(true)}
            className={
              "rounded-xl border px-6 py-2 " +
              (form.isPrivate ? "bg-black/80 text-white" : "hover:bg-neutral-50")
            }
          >
            שירות פרטי
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
{form.isPrivate ? (
  /* Private client */
  <div>
    <div className={labelCls + " flex items-center justify-between"}>
      <span>שם לקוח</span>
      {errors.privateClientName && <div className="text-xs text-red-600 mt-1">{errors.privateClientName}</div>}
      <span className="text-xs text-neutral-500">
        {pcLoading ? "טוען..." : pcOffline ? "אופליין" : pcFromCache ? "מהזיכרון" : "מעודכן"}
      </span>
    </div>

    <select
      className={inputCls + (errors.privateClientName ? " border-red-600" : "")}
      value={form.privateClientId || ""}
      onChange={(e) => onChoosePrivateClient(e.target.value)}
    >
      <option value="">בחר לקוח קיים... (או הקלד/י שם חדש למטה)</option>
      {privateClients.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>

    {!pcOffline && (
      <button type="button" className="mt-2 text-xs underline" onClick={refreshPrivateClients}>
        רענן לקוחות
      </button>
    )}

    <div className="mt-3">
      <div className={labelCls}>שם לקוח חדש</div>
      <input
        className={inputCls + (errors.privateClientName ? " border-red-600" : "")}
        value={form.privateClientName || ""}
        onChange={(e) => {
          setField("privateClientId")("");
          setField("privateClientName")(e.target.value);
        }}
        placeholder="הקלד/י שם לקוח"
      />
    </div>
  </div>
) : (
  <>
{/* Company */}
<div>
  <div className={labelCls + " flex items-center justify-between"}>
    <span>חברה</span>
    {errors.company && <div className="text-xs text-red-600 mt-1">{errors.company}</div>}
    <span className="text-xs text-neutral-500">
      {coLoading ? "טוען..." : coOffline ? "אופליין" : coFromCache ? "מהזיכרון" : "מעודכן"}
    </span>
  </div>

  <select
    className={inputCls + (errors.company ? " border-red-600" : "")}
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
    {errors.project && <div className="text-xs text-red-600 mt-1">{errors.project}</div>}
    <span className="text-xs text-neutral-500">
      {projLoading ? "טוען..." : projOffline ? "אופליין" : projFromCache ? "מהזיכרון" : "מעודכן"}
    </span>
  </div>

  <select
    className={inputCls + (errors.project ? " border-red-600" : "")}
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
  </>
)}

          <div>
            <div className={labelCls}>מנהל עבודה
               {errors.manager && <div className="text-xs text-red-600 mt-0.5 mr-6">{errors.manager}</div>}
            </div>
           
            <input
              className={inputCls + (errors.manager ? " border-red-600" : "")}
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
            <div className={labelCls}>ראש צוות
            {errors.teamLead && <div className="text-xs text-red-600 mt-0.5 mr-6">{errors.teamLead}</div>}
            </div>
            <input
              className={inputCls + (errors.teamLead ? " border-red-600" : "")}
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
      <section className="rounded-2xl border bg-white p-4 shadow-sm pb-20">
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
