
import  {useState ,useEffect, use} from "react";
import {setupOnlineDrain } from "./utils/queue/sendOrQueue";
import { Stroke, SigMeta } from "./components/SignaturePad";
import {WorkLogForm } from "./utils/pdf/WorkLogPDF";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { useCompanies } from "../data/useCompanies";
import { useProjects } from "../data/useProjects";
import AsyncButton from "../admin/components/AsyncButton";
import { useNavigate, useParams } from "react-router-dom";
import RegularForm from "./components/RegularForm";
import DesktopForm from "./components/DesktopForm";
import saveToFirebase from "./workLog/saveToFirebase";
import downloadVectorPDF from "./workLog/downloadVectorPDF";
import sendWhatsApp from "./workLog/sendWhatsApp";
import sendEmail from "./workLog/sendEmail";
import PrintCSS from "./utils/pdf/PrintCSS";
import WorkerProfileModal from "./workLog/WorkerProfileModal";
import FieloStartLoginPage from "../FieloStartLoginPage";
import { loadWorkerFromCache, saveWorkerToCache } from "../data/WorkerStore";

const API_BASE = process.env.BACKEND_URL || "http://localhost:8080";

export default function SurveyWorkLog1() {

  const [sigManager, setSigManager] = useState<Stroke[]>([]);
  const [sigLead, setSigLead] = useState<Stroke[]>([]);
  const [sigMeta, setSigMeta] = useState<SigMeta>({ w: 600, h: 120 }); 
  const [moreOpen, setMoreOpen] = useState(false);
  const { surveyId: surveyIdParam = "" } = useParams<{ surveyId: string }>();
  const [surveyId, setSurveyId] = useState<string>(surveyIdParam || localStorage.getItem("surveyId") || "");
  const [workerId, setWorkerId] = useState<string>(localStorage.getItem("workerId") || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
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
  };

  const isDesktop = useIsDesktop();

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

 

  return (
    <div className="min-h-screen bg-neutral-100 py-6 print:bg-white">
      {/* <PrintCSS /> */}
      <div className="mx-auto max-w-[900px] px-3">

    {isDesktop ? (
      <>
      <div className="flex justify-between items-center   w-full print:hidden ">
      <div className=" flex justify-between items-center print:hidden">
        <h1 className="text-xl font-semibold">
          יומן עבודה – טופס מדידות
        </h1>
      </div>
      <div className="flex items-center justify-between pt-3 pl-3 print:hidden">
          <button
           disabled={!coOffline}
           onClick={() => setProfileModalOpen && setProfileModalOpen(true)}
          className={`shrink-0 h-16 w-16 rounded-full mb-2
          flex justify-center items-center font-bold transition
          ${coOffline 
            ? "bg-purple-400 hover:bg-purple-500 text-white cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
          }`}
          >
            {form.teamLead ? form.teamLead.charAt(0) : "—"}
          </button>

      </div>

       </div>
      <div className="flex gap-2 mb-4">

        <AsyncButton onClick={printPage} >
          הדפס
        </AsyncButton>
        <AsyncButton onClick={() => downloadVectorPDF(form, setForm, setErrors, sigManager, sigLead, sigMeta, surveyId, resetForm, API_BASE, nav)} >
          הורד PDF
        </AsyncButton>
        <AsyncButton onClick={() => sendWhatsApp(form, setErrors , sigManager, sigLead, sigMeta, surveyId ,resetForm)} >
          שלח בוואטסאפ
        </AsyncButton>
        <AsyncButton onClick={() => sendEmail(form, setErrors , sigManager, sigLead, sigMeta, surveyId ,resetForm)} >
          שלח במייל
        </AsyncButton>
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
            }>
          שמור
        </AsyncButton>
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
      {moreOpen && (
        <div className="fixed inset-0 z-50 " onClick={() => setMoreOpen(false)}>
          {/* רקע כהה */}
          <div className="absolute inset-0 bg-black/40 mt-16" />

          {/* מגירה מלמטה */}
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-16 border "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-neutral-300" />
            <div className="grid grid-cols-2 gap-3 text-right" dir="rtl">
             <AsyncButton
                onClick={() => { setMoreOpen(false); downloadVectorPDF(form, setForm, setErrors, sigManager, sigLead, sigMeta, surveyId, resetForm, API_BASE, nav); }}
                className="h-12 rounded-xl border active:scale-[0.99]"
              >
                הורד PDF
              </AsyncButton>
              <AsyncButton
                onClick={() => { setMoreOpen(false); sendWhatsApp(form, setErrors , sigManager, sigLead, sigMeta, surveyId ,resetForm); }}
                className="h-12 rounded-xl border active:scale-[0.99]"
              >
                שלח בוואטסאפ
              </AsyncButton>
              <AsyncButton
                onClick={() => { setMoreOpen(false); sendEmail(form, setErrors , sigManager, sigLead, sigMeta, surveyId ,resetForm)}}
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
    </div>}

     {profileModalOpen && !coOffline && (
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
              workDescription={workDescription}
              selectedWorkDescription={selectedWorkDescription}
              setSelectedWorkDescription={setSelectedWorkDescription}
            />)}
          </div>
        </div>
      );
    }




