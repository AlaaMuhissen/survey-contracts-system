import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadSurveyFromCache, saveSurveyToCache } from "../../data/surveyStore";

const API_BASE = process.env.BACKEND_URL || "http://localhost:8080";

type Survey = {
  name?: string;
  address?: string;
  phone?: string;
  businessId?: string;
  logoUrl?: string; 
};

export default function SurveyHeaderBand({isItDesktop , workerName , setProfileModalOpen}: {isItDesktop?: boolean , workerName: string , setProfileModalOpen?: (open: boolean) => void}) {
  const { surveyId = "" } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey>({});
  const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!surveyId) return;

  const onOnline = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/admin/surveys/${encodeURIComponent(surveyId)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      const fresh = data?.survey ?? {};

      setSurvey(fresh);
      await saveSurveyToCache(surveyId, fresh);
    } catch (e) {
      console.warn("survey refresh failed:", e);
    }
  };

  window.addEventListener("online", onOnline);

  return () => {
    window.removeEventListener("online", onOnline);
  };
}, [surveyId]);
useEffect(() => {
  let ignore = false;

  async function loadSurvey() {
    if (!surveyId) return;

    // 1️⃣ load cached survey first
    try {
      const cached = await loadSurveyFromCache(surveyId);
      if (!ignore && cached) {
        setSurvey(cached);
        setLoading(false);
      }
    } catch {}

    // 2️⃣ stop if offline
    if (!navigator.onLine) {
      if (!ignore) setLoading(false);
      return;
    }

    // 3️⃣ fetch fresh survey
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/surveys/${encodeURIComponent(surveyId)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const fresh = data?.survey ?? {};

      if (!ignore) setSurvey(fresh);
      await saveSurveyToCache(surveyId, fresh);
    } catch (e) {
      console.warn("load survey failed:", e);
    } finally {
      if (!ignore) setLoading(false);
    }
  }

  loadSurvey();

  return () => {
    ignore = true;
  };
}, [surveyId]);


  if (loading) {
    return (
      <div className="flex items-center justify-between gap-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border border-black/20 bg-neutral-100" />
          <div className="leading-tight text-right">
            <div className="h-4 w-40 bg-neutral-100 rounded mb-1" />
            <div className="h-3 w-48 bg-neutral-100 rounded mb-1" />
            <div className="h-3 w-32 bg-neutral-100 rounded" />
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block border px-2 py-1 text-xs">
            <div className="h-3 w-20 bg-neutral-100 rounded mb-1" />
            <div className="h-3 w-24 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

 
  return (
  <>
    {isItDesktop ? (
      <div className="flex items-start gap-4 border-b border-black/80 pb-3">
        <div className="w-12 h-12 rounded-full border border-black/60 shrink-0 flex items-center justify-center text-xs">
          {survey.logoUrl ? (
            <img
              src={survey.logoUrl}
              alt="לוגו"
              className="w-12 h-12 rounded-full border border-black/60 object-contain bg-white"
            />
          ) : (
            <>לוגו</>
          )}
        </div>

        <div className="flex-1">
          <div className="text-2xl font-bold leading-tight">{survey.name || "—"}</div>
          <div className="text-sm">{survey.address || "—"}</div>
          <div className="text-sm">{survey.phone || "—"}</div>
        </div>



        <div className="shrink-0 text-sm text-right">
          <div className="border border-black/70 px-2 py-1 inline-block mb-2">
            עוסק מורשה
            <br />
            <span className="font-mono">{survey.businessId || "—"}</span>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
         <div className="w-12 h-12 rounded-full border border-black/60 shrink-0 flex items-center justify-center text-xs">
          {survey.logoUrl ? (
            <img
              src={survey.logoUrl}
              alt="לוגו"
              className="w-12 h-12 rounded-full border border-black/60 object-contain bg-white"
            />
          ) : (
            <>לוגו</>
          )}
          </div>
          <div className="leading-tight text-right">
            <div className="text-lg font-bold">{survey.name || "—"}</div>
            <div className="text-xs">{survey.address || "—"}</div>
            <div className="text-xs">{survey.phone || "—"}</div>
          </div>
        </div>
          <button
            type="button"
            onClick={() => setProfileModalOpen && setProfileModalOpen(true)}
            className="shrink-0 h-16 w-16 rounded-full border bg-purple-400 mb-2
                      flex justify-center items-center text-white font-bold
                      hover:bg-purple-500 transition"
          >
            {workerName ? workerName.charAt(0) : "—"}
          </button>
        {/* <div className="shrink-0 h-10 w-10 rounded-full border bg-purple-400 px-2 py-1  mb-2 flex justify-center items-center text-white font-bold">
               {workerName ? workerName.charAt(0) : "—"}
        </div> */}
        <div className="text-right">
          <div className="inline-block border px-2 py-1 text-xs">
            עוסק מורשה
            <br />
            <span className="font-mono">{survey.businessId || "—"}</span>
          </div>
        </div>
      </div>
    )}
  </>
);

}
