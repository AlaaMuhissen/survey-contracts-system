import localforage from "localforage";

const API = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8080"; 

type Survey = {
  name?: string;
  address?: string;
  phone?: string;
  businessId?: string;
  logoUrl?: string;
};

const SURVEY_KEY = (surveyId: string) => `survey:${surveyId}`;

export async function saveSurveyToCache(surveyId: string, survey: Survey) {
  await localforage.setItem(SURVEY_KEY(surveyId), {
    survey,
    cachedAt: Date.now(),
  });
}

export async function loadSurveyFromCache(surveyId: string): Promise<Survey | null> {
  const cached = await localforage.getItem<{ survey: Survey; cachedAt: number }>(SURVEY_KEY(surveyId));
  return cached?.survey ?? null;
}

export async function fetchSurveyCached(surveyId: string): Promise<Survey> {
  // 1) Try cache first (works offline)
  const cached = await loadSurveyFromCache(surveyId);
  if (cached) return cached;

  // 2) If offline and no cache -> return empty (still generate PDF)
  if (!navigator.onLine) return {};

  // 3) Online fetch + save to cache
  const res = await fetch(`${API}/admin/surveys/${encodeURIComponent(surveyId)}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` },
    // ✅ don't force no-store if you want browser cache to help;
    // but even if you keep it, localforage cache still works.
  });

  if (!res.ok) throw new Error(`Failed to load survey (HTTP ${res.status})`);
  const data = await res.json();
  const survey = data?.survey ?? {};

  await saveSurveyToCache(surveyId, survey);
  return survey;
}
