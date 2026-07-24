import  {useState ,useEffect, useRef, use} from "react";
import { createPortal } from "react-dom";
import {setupOnlineDrain } from "./utils/queue/sendOrQueue";
import { Stroke, SigMeta } from "./components/SignaturePad";
import {WorkLogForm } from "./utils/pdf/WorkLogPDF";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { useCompanies } from "../data/useCompanies";
import { useProjects } from "../data/useProjects";
import { usePrivateClients } from "../data/usePrivateClients";
import AsyncButton from "../admin/components/AsyncButton";
import { useNavigate, useParams } from "react-router-dom";
import RegularForm from "./components/RegularForm";
import DesktopForm from "./components/DesktopForm";
import saveToFirebase from "./workLog/saveToFirebase";
import downloadVectorPDF from "./workLog/downloadVectorPDF";
import sendWhatsApp from "./workLog/sendWhatsApp";
import sendEmail from "./workLog/sendEmail";
import { sendForManagerSignature, buildManagerSignLink, openWhatsAppWithLink } from "./workLog/sendForManagerSignature";
import { validateWorklog, describeMissingFields } from "./utils/validation/validateWorklog";
import PrintCSS from "./utils/pdf/PrintCSS";
import WorkerProfileModal from "./workLog/WorkerProfileModal";
import FieloStartLoginPage from "../FieloStartLoginPage";
import { loadWorkerFromCache, saveWorkerToCache } from "../data/WorkerStore";

const API_BASE = process.env.BACKEND_URL || "https://survey-contracts-system-backend.onrender.com";

export default function SurveyWorkLog1() {

  const [sigManager, setSigManager] = useState<Stroke[]>([]);
  const [sigLead, setSigLead] = useState<Stroke[]>([]);
  const [sigMeta, setSigMeta] = useState<SigMeta>({ w: 600, h: 120 }); 
  const [moreOpen, setMoreOpen] = useState(false);
  const { surveyId: surveyIdParam = "" } = useParams<{ surveyId: string }>();
  const [surveyId, setSurveyId] = useState<string>(surveyIdParam || localStorage.getItem("surveyId") || "");
  const [workerId, setWorkerId] = useState<string>(localStorage.getItem("workerId") || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Tracks the pending-signature token (if any) this form was restored
  // from, so it can be cleaned up only once the worklog is actually saved/
  // sent — not the moment the worker opens it to keep filling it in.
  const restoredPendingTokenRef = useRef<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const nav = useNavigate();
  const [synced, setSynced] = useState<any[]>([]);
  const workerName = localStorage.getItem("workerName") || "";
  //const workDescription =  [ "אזמיד" ,"סימון גובה" , "סימון גדר", "סימון אש", "סימון קומה"] 
  const workDescription = [
    { id: "azmid", name: "אזמיד" },
    { id: "heightMarking", name: "סימון גובה" },
    { id: "fenceMarking", name: "סימון גדר" },  
    { id: "fireMarking", name: "סימון אש" },
    { id: "floorMarking", name: "סימון קומה" },
  ]
  const [selectedWorkDescription, setSelectedWorkDescription] = useState<string[]>([]);

  useEffect(() => {
    const cleanup = setupOnlineDrain((resp, item) => {
      setSynced(s => [...s, resp.number]);
    });

    return cleanup; 
  }, []);
  const workerToken = localStorage.getItem("workerToken") || "";
  const hasKey = Boolean(workerToken.trim());
  const [form, setForm] = useState<WorkLogForm>({
    surveyId: "",
    src: "מקור",
    number: "00000",
    date: new Date(),
    company: "",
    companyId: "",
    projectId: "",
    project: "",
    isPrivate: false,
    privateClientId: "",
    privateClientName: "",
    manager: "",
    teamLead: "",
    helper1: "",
    helper2: "",
    workDesc: "",
    notes: "",
    dayType: "full",
  });

  const INITIAL_FORM: WorkLogForm = {
    src: "מקור",
    number: "00000",
    date: new Date(),
    company: "",
    companyId: "",
    projectId: "",
    project: "",
    isPrivate: false,
    privateClientId: "",
    privateClientName: "",
    manager: "",
    teamLead: workerName || "",
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
    setSelectedWorkDescription([]);

    // This form is actually done (saved/downloaded/sent) — now it's safe
    // to remove the pending-signature record it came from, if any.
    const pendingToken = restoredPendingTokenRef.current;
    if (pendingToken) {
      restoredPendingTokenRef.current = null;
      const t = localStorage.getItem("workerToken");
      fetch(`${API_BASE}/surveys/${encodeURIComponent(surveyId)}/pending-signatures/${pendingToken}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    }
  };

  const isDesktop = useIsDesktop();

  // If the worker navigated here from the pending-signatures list after a
  // manager signed remotely, restore that exact form + both signatures so
  // they can review and do the final submit.
  useEffect(() => {
    const raw = localStorage.getItem("restoreSignedWorklog");
    if (!raw) return;
    localStorage.removeItem("restoreSignedWorklog");
    try {
      const {
        token: pendingToken,
        formSnapshot,
        sigManager: restoredSigManager,
        sigLead: restoredSigLead,
        sigMeta: restoredSigMeta,
      } = JSON.parse(raw);
      if (pendingToken) restoredPendingTokenRef.current = pendingToken;
      if (formSnapshot) {
        setForm((s) => ({
          ...s,
          ...formSnapshot,
          date: formSnapshot.date ? new Date(formSnapshot.date) : s.date,
        }));
        // RegularForm/DesktopForm derive form.workDesc from
        // selectedWorkDescription via their own effect — without restoring
        // the matching checkbox ids here too, that effect fires right
        // after this and overwrites the restored workDesc back to "".
        if (typeof formSnapshot.workDesc === "string" && formSnapshot.workDesc.trim()) {
          const names = formSnapshot.workDesc.split(",").map((s: string) => s.trim());
          const ids = workDescription.filter((w) => names.includes(w.name)).map((w) => w.id);
          if (ids.length) setSelectedWorkDescription(ids);
        }
      }
      if (Array.isArray(restoredSigManager)) setSigManager(restoredSigManager);
      if (Array.isArray(restoredSigLead)) setSigLead(restoredSigLead);
      if (restoredSigMeta) setSigMeta(restoredSigMeta);
    } catch (e) {
      console.error("restoreSignedWorklog parse failed:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js");
    });
  }

  
  // ensure surveyId is persisted
  useEffect(() => {
    if (surveyIdParam) {
      setSurveyId(surveyIdParam);
      localStorage.setItem("surveyId", surveyIdParam);
    }
  }, [surveyIdParam]);

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

  // switch between "company/project" mode and "private service" mode —
  // clears out whichever side isn't in use so a stale value can't sneak
  // into validation or the saved record
  const onToggleMode = (nextIsPrivate: boolean) => {
    setForm((s) => ({
      ...s,
      isPrivate: nextIsPrivate,
      ...(nextIsPrivate
        ? { companyId: "", company: "", projectId: "", project: "" }
        : { privateClientId: "", privateClientName: "" }),
    }));
  };

  // picking an existing private client from the dropdown; typing a new name
  // instead goes straight through setField("privateClientName") and clears
  // privateClientId (see RegularForm/DesktopForm)
  const onChoosePrivateClient = (privateClientId: string) => {
    const c = privateClients.find((x) => x.id === privateClientId);
    setField("privateClientId")(privateClientId);
    setField("privateClientName")(c?.name || "");
  };

  const authHeaders: HeadersInit | undefined = workerToken
    ? { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}` 
      }
      : undefined;


  const {
    companies, loading: coLoading, offline: coOffline, fromCache: coFromCache, refresh: refreshCompanies
  } = useCompanies(API_BASE, authHeaders);

  const {
    projects, loading: projLoading, offline: projOffline, fromCache: projFromCache, refresh: refreshProjects
  } = useProjects(API_BASE, form.companyId, authHeaders);

  const {
    privateClients, loading: pcLoading, offline: pcOffline, fromCache: pcFromCache, refresh: refreshPrivateClients
  } = usePrivateClients(API_BASE, authHeaders);

  async function fetchWorker(surveyId: string) {
    // OFFLINE FAST PATH
    if (!navigator.onLine) {
      const cached = await loadWorkerFromCache(surveyId, workerId);
      if (cached) {
        setForm((s) => ({
          ...s,
          surveyId,
          teamLead: cached.displayName || "",
        }));
        return cached;
      }

      // no cache => do something safe
      setForm((s) => ({ ...s, surveyId, teamLead: s.teamLead || "" }));
      return null;
    }

    // ONLINE PATH
    const res = await fetch(
      `${API_BASE}/admin/surveys/${encodeURIComponent(surveyId)}/workers/${encodeURIComponent(workerId)}`,
      { headers: { Authorization: `Bearer ${workerToken}` } }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Failed to load worker (${res.status}): ${txt}`);
    }

    const data = await res.json();
    const worker = data.worker;

    setForm((s) => ({
      ...s,
      surveyId,
      teamLead: worker?.displayName || "",
    }));

    // ✅ cache it for offline next time
    await saveWorkerToCache(surveyId, workerId, worker);

    return worker;
  }
  useEffect(() => {
    if (workerId && surveyId && workerToken) {
      fetchWorker(surveyId).catch((err) => {
        console.error("Worker fetch failed:", err);
      });
    }
  }, [workerId, surveyId, workerToken]);



    useEffect(() => {
      if(!hasKey){
        nav("/");
      }
    }, [hasKey]);

  const printPage = () => window.print();

  const handleSendForSignature = async () => {
    const errs = validateWorklog(form, { sigManager, sigLead }, { requireManagerSignature: false });
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      alert(`חסרים השדות הבאים: ${describeMissingFields(errs)}`);
      return;
    }
    try {
      const token = await sendForManagerSignature(form, sigLead, sigMeta, surveyId, API_BASE);
      const link = buildManagerSignLink(surveyId, token);
      openWhatsAppWithLink(link);
      resetForm();
    } catch (e) {
      console.error("sendForManagerSignature failed:", e);
      alert("שגיאה בשליחה לחתימת מנהל");
    }
  };

 

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white print:bg-white py-6">
      {/* <PrintCSS /> */}
      <div className="mx-auto max-w-[900px] px-3">

    {isDesktop ? (
      <>
      <div className="flex justify-between items-center w-full print:hidden mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 13h6M9 17h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-black/85 leading-tight">יומן עבודה</h1>
            <p className="text-xs text-neutral-500">טופס מדידות</p>
          </div>
        </div>

        <button
          onClick={() => setProfileModalOpen && setProfileModalOpen(true)}
          className="shrink-0 h-12 w-12 rounded-full flex justify-center items-center font-bold transition
          bg-gradient-to-br from-violet-600 to-indigo-600 hover:brightness-105 text-white shadow-sm cursor-pointer"
        >
          {form.teamLead ? form.teamLead.charAt(0) : "—"}
        </button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm p-3 mb-5 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={printPage}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm text-black/70 hover:bg-neutral-50 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M6 9V3h12v6" /><rect x="6" y="13" width="12" height="8" />
              <path d="M4 9h16a2 2 0 0 1 2 2v5h-4M2 16v-5a2 2 0 0 1 2-2" />
            </svg>
            הדפס
          </button>

          <button
            onClick={() => downloadVectorPDF(form, setForm, setErrors, sigManager, sigLead, sigMeta, surveyId, resetForm, API_BASE, nav)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm text-black/70 hover:bg-neutral-50 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M5 21h14" />
            </svg>
            הורד PDF
          </button>

          <button
            onClick={() => sendWhatsApp(form, setForm, setErrors , sigManager, sigLead, sigMeta, surveyId ,resetForm, API_BASE, nav)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm text-black/70 hover:bg-neutral-50 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-emerald-600">
              <path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.1L21 3l-1 3.6a8.5 8.5 0 0 1 1 4.9z" />
              <path d="M8.5 10.5c.3 2 2.2 3.9 4.2 4.2" />
            </svg>
            וואטסאפ
          </button>

          <button
            onClick={() => sendEmail(form, setForm, setErrors , sigManager, sigLead, sigMeta, surveyId ,resetForm, API_BASE, nav)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm text-black/70 hover:bg-neutral-50 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
            </svg>
            מייל
          </button>

          {sigManager.length === 0 && (
            <button
              onClick={handleSendForSignature}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white
                         bg-gradient-to-l from-violet-600 to-indigo-600 shadow-sm hover:brightness-105 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
              שלח לחתימת מנהל
            </button>
          )}

          <div className="w-px h-6 bg-neutral-200 mx-1" />

          {/* <button
            onClick={() => nav(`/${encodeURIComponent(surveyId)}/pending-signatures`)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm text-black/70 hover:bg-neutral-50 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 13l2 2 4-4" />
            </svg>
            בקשות חתימה
          </button>

          <button
            onClick={() => nav(`/${encodeURIComponent(surveyId)}/my-worklogs`)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm text-black/70 hover:bg-neutral-50 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 7l3-3h5l2 2h8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            </svg>
            היומנים שלי
          </button> */}

          <div className="grow" />

          <AsyncButton
            className="!bg-black !text-white hover:!bg-black/85 !border-black !px-5"
            onClick={() =>
                saveToFirebase(
                  form,
                  setForm,
                  setErrors,
                  sigManager,
                  sigLead,
                  sigMeta,
                  surveyId,
                  resetForm,
                  API_BASE,
                  nav
                )
              }>
            שמור
          </AsyncButton>
        </div>
      </div>
      </>
    ) : <div className="md:hidden fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-[900px] px-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <div className="bg-white border shadow-[0_-6px_20px_rgba(0,0,0,0.08)] rounded-2xl p-2 flex gap-2 items-center">

          <AsyncButton
            onClick={() =>
                saveToFirebase(
                  form,
                  setForm,
                  setErrors,
                  sigManager,
                  sigLead,
                  sigMeta,
                  surveyId,
                  resetForm,
                  API_BASE,
                  nav
                )
              }
            className="flex-[1.4] h-12 rounded-xl  text-base active:scale-[0.99]" 
          >
            שמור
          </AsyncButton>
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 h-12 rounded-xl border bg-black/80 text-white text-base active:scale-[0.99]"
          >
            עוד
          </button>
        </div>
      </div>
      {moreOpen && createPortal(
        <div className="fixed inset-0 z-50" dir="rtl" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />

          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl
                       px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-neutral-300" />

            <div className="grid grid-cols-2 gap-2.5">
              <AsyncButton
                onClick={() => { setMoreOpen(false); downloadVectorPDF(form, setForm, setErrors, sigManager, sigLead, sigMeta, surveyId, resetForm, API_BASE, nav); }}
                className="flex-col h-auto py-4 gap-1.5 rounded-2xl border bg-neutral-50 text-black/70 hover:bg-neutral-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-indigo-600">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M5 21h14" />
                </svg>
                <span className="text-xs font-medium">הורד PDF</span>
              </AsyncButton>

              <AsyncButton
                onClick={() => { setMoreOpen(false); sendWhatsApp(form, setForm, setErrors , sigManager, sigLead, sigMeta, surveyId ,resetForm, API_BASE, nav); }}
                className="flex-col h-auto py-4 gap-1.5 rounded-2xl border bg-neutral-50 text-black/70 hover:bg-neutral-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-emerald-600">
                  <path d="M21 11.5a8.5 8.5 0 1 1-3.8-7.1L21 3l-1 3.6a8.5 8.5 0 0 1 1 4.9z" />
                  <path d="M8.5 10.5c.3 2 2.2 3.9 4.2 4.2" />
                </svg>
                <span className="text-xs font-medium">שלח בוואטסאפ</span>
              </AsyncButton>

              <AsyncButton
                onClick={() => { setMoreOpen(false); sendEmail(form, setForm, setErrors , sigManager, sigLead, sigMeta, surveyId ,resetForm, API_BASE, nav)}}
                className="flex-col h-auto py-4 gap-1.5 rounded-2xl border bg-neutral-50 text-black/70 hover:bg-neutral-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-indigo-600">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <span className="text-xs font-medium">שלח במייל</span>
              </AsyncButton>

              <AsyncButton
                onClick={() => { setMoreOpen(false); printPage(); }}
                className="flex-col h-auto py-4 gap-1.5 rounded-2xl border bg-neutral-50 text-black/70 hover:bg-neutral-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="text-indigo-600">
                  <path d="M6 9V3h12v6" /><rect x="6" y="13" width="12" height="8" />
                  <path d="M4 9h16a2 2 0 0 1 2 2v5h-4M2 16v-5a2 2 0 0 1 2-2" />
                </svg>
                <span className="text-xs font-medium">הדפס</span>
              </AsyncButton>

              {sigManager.length === 0 && (
                <AsyncButton
                  onClick={() => { setMoreOpen(false); handleSendForSignature(); }}
                  className="col-span-2 h-12 rounded-2xl border-0 bg-gradient-to-l from-violet-600 to-indigo-600 text-white shadow-md hover:brightness-105"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                  </svg>
                  <span className="text-sm font-medium">שלח לחתימת מנהל</span>
                </AsyncButton>
              )}
            </div>

            <button
              onClick={() => setMoreOpen(false)}
              className="w-full flex items-center justify-center mt-3 gap-2 h-12 rounded-xl
                       bg-red-50 text-red-600 font-medium hover:bg-red-100 active:scale-[0.98] transition"
            >
              סגור
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>}

     {profileModalOpen && (
        <WorkerProfileModal
          onClose={() => setProfileModalOpen(false)}
          form={form}
          setForm={setForm}
          surveyId={surveyId}
        />
      )}

   {isDesktop ? (
              <DesktopForm
              form={form}
              setField={setField}
              sigManager={sigManager}
              setSigManager={setSigManager}
              sigLead={sigLead}
              setSigLead={setSigLead}
              setSigMeta={setSigMeta}
              errors={errors}
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
              privateClients={privateClients}
              pcLoading={pcLoading}
              pcOffline={pcOffline}
              pcFromCache={pcFromCache}
              refreshPrivateClients={refreshPrivateClients}
              onChoosePrivateClient={onChoosePrivateClient}
              onToggleMode={onToggleMode}
              workDescription={workDescription}
              selectedWorkDescription={selectedWorkDescription}
              setSelectedWorkDescription={setSelectedWorkDescription}

              />
            ) : (   <RegularForm
              form={form}
              setField={setField}
              sigManager={sigManager}
              setSigManager={setSigManager}
              sigLead={sigLead}
              setSigLead={setSigLead}
              setSigMeta={setSigMeta}
              errors={errors}
              setprofileModalOpen={setProfileModalOpen}
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
              privateClients={privateClients}
              pcLoading={pcLoading}
              pcOffline={pcOffline}
              pcFromCache={pcFromCache}
              refreshPrivateClients={refreshPrivateClients}
              onChoosePrivateClient={onChoosePrivateClient}
              onToggleMode={onToggleMode}
              workDescription={workDescription}
              selectedWorkDescription={selectedWorkDescription}
              setSelectedWorkDescription={setSelectedWorkDescription}
            />)}
          </div>
        </div>
      );
    }